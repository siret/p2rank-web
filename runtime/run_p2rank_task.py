#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Run p2rank task.
#

import os
import argparse
import logging
import typing
import subprocess
import json
import shutil
import zipfile
import gzip
import collections

import requests

import conservation
import blast_database

PROTEIN_UTILS_CMD = os.environ["PROTEIN_UTILS_CMD"]

HSSP_DATABASE_DIR = os.environ["HSSPTDB"]

StructureTuple = collections.namedtuple(
    "StructureTuple", ["raw_file", "file", "fasta_files", "chains"])

ConservationTuple = collections.namedtuple(
    "ConservationTuple", ["file", "msa_file"])


def _read_arguments() -> typing.Dict[str, str]:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True,
                        help="Input directory.")
    parser.add_argument("--working", required=True,
                        help="Working directory.")
    parser.add_argument("--output", required=True,
                        help="Output directory.")
    parser.add_argument("--configuration", required=True,
                        help="JSON file.")
    parser.add_argument("--p2rank", required=True,
                        help="p2rank directory.")
    return vars(parser.parse_args())


def main(arguments):
    initialize(arguments)
    configuration = load_json(arguments["configuration"])
    structure = prepare_structure(arguments, configuration)
    conservation_files = prepare_conservation(
        configuration, arguments, structure)
    p2rank_output = execute_p2rank(
        arguments, structure.file, configuration, conservation_files)
    prepare_download_data(
        arguments, p2rank_output, structure, conservation_files)
    prepare_p2rank_web_data(
        p2rank_output, structure, conservation_files, arguments["output"])


def initialize(arguments) -> None:
    init_logging()
    prepare_directories(arguments)


def init_logging() -> None:
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] - %(message)s",
        datefmt="%m/%d/%Y %H:%M:%S")


def prepare_directories(arguments):
    os.makedirs(arguments["working"], exist_ok=True)
    os.makedirs(arguments["output"], exist_ok=True)


def load_json(file: str) -> typing.Dict:
    with open(file) as stream:
        return json.load(stream)


def prepare_structure(arguments, configuration) -> StructureTuple:
    logging.info("Preparing structure ...")
    raw_structure_file = prepare_raw_structure_file(
        arguments, configuration["structure"])
    chains = configuration["structure"].get("chains", None)
    execute_command(
        f"{PROTEIN_UTILS_CMD} PrepareForP2Rrank"
        f" --input {raw_structure_file}"
        f" --output {arguments['working']}"
        + (" --chains=" + ",".join(chains) if chains is not None else ""))
    structure_info = load_json(
        os.path.join(arguments["working"], "structure-info.json"))
    structure_file = os.path.join(arguments["working"], "structure.pdb")
    chains_to_use = sanitize_chains(
        filter_amino_chains(structure_info, chains))
    fasta_files = {
        key: f"chain_{value}.fasta"
        for key, value in chains_to_use.items()
    }
    return StructureTuple(
        raw_structure_file, structure_file, fasta_files,
        set(chains_to_use.keys()))


def prepare_raw_structure_file(arguments, structure):
    structure_file = os.path.join(arguments["working"], "structure-raw.pdb")
    if structure.get("code", None) is not None:
        url = "https://files.rcsb.org/download/" \
              + structure["code"] \
              + ".pdb"
        download(url, structure_file)
    elif structure.get("file", None) is not None:
        input_path = os.path.join(arguments["input"], structure["file"])
        shutil.copy(input_path, structure_file)
    else:
        raise Exception("Missing structure file information.")
    return structure_file


def download(url: str, destination: str) -> None:
    logging.debug(f"Downloading '{url}' to '{destination}' ...")
    response = requests.get(url)
    with open(destination, "wb") as stream:
        stream.write(response.content)


def filter_amino_chains(structure_info, chains) -> typing.Dict[str, str]:
    """
    Check that all required chains are in the structure info file.
    Select chains for conservation - only amino chains.
    """
    if chains is None or len(chains) == 0:
        # Use all amino we got.
        return {
            chain_info["name"]: chain_info["id"]
            for chain_info in structure_info["chains"]
            if "amino" in chain_info["types"]
        }
    chains_found = set()
    result = {}
    for required_chain_name in chains:
        for chain_info in structure_info["chains"]:
            if not chain_info["name"] == required_chain_name:
                continue
            chains_found.add(required_chain_name)
            if "amino" not in chain_info["types"]:
                continue
            result[required_chain_name] = chain_info["id"]
    if not set(chains).issubset(chains_found):
        raise Exception(
            f"Requested chains {chains} but only "
            f"{list(chains_found)} are available.")
    return result

def sanitize_chains(chains: typing.Dict[str, str]) -> typing.Dict[str, str]:
    result = {}
    for key, value in chains.items():
        # PDB file may not specify chain name, in such a case
        # P2Rank use 'A' as a chain name. The chain name is used
        # to name conservation file, so we need to do this change.
        # In our script we use chain name for HSSP and MSA file, in such
        # cases it is also desired behaviour, as we need name of the chain
        # not an empty string. It might be an issue if there is an empty
        # named chain in HSSP however.
        if key == " ":
            key = "A"
        if key in result:
            raise Exception("Multiple chains of same name found!")
        result[key] = value
    return result

def execute_command(command: str):
    result = subprocess.run(command, shell=True, env=os.environ.copy())
    # Throw for non-zero (failure) return code.
    result.check_returncode()


def prepare_conservation(
        configuration, arguments, structure: StructureTuple) \
        -> typing.Dict[str, ConservationTuple]:
    if should_use_conservation(configuration):
        logging.info("No conservation is used.")
        return dict()
    conservation_options = configuration["conservation"]
    if conservation_options.get("hssp", None) is not None:
        return prepare_conservation_from_hssp(
            conservation_options, arguments["working"], structure.chains)
    elif conservation_options.get("msaFile", None) is not None:
        return prepare_conservation_from_msa(
            structure.chains, conservation_options,
            arguments["input"], arguments["working"])
    else:
        return compute_conservations(arguments, structure)


def should_use_conservation(configuration) -> bool:
    return "conservation" not in configuration \
           or not configuration["conservation"].get("compute", False)


def prepare_conservation_from_hssp(
        conservation_options, working_dir: str,
        chains: typing.Set[str]) -> typing.Dict[str, ConservationTuple]:
    hssp_code = conservation_options["hssp"]
    result = {}
    for chain in chains:
        source_file = os.path.join(
            HSSP_DATABASE_DIR,
            f"{hssp_code}{chain}.hssp.fasta.scores.gz")
        target_file = os.path.join(
            working_dir,
            f"structure_{chain}.score")
        gunzip_file(source_file, target_file)
        result[chain] = ConservationTuple(target_file, None)
    return result


def gunzip_file(source: str, target: str):
    with gzip.open(source, "rb") as input_stream, \
            open(target, "wb") as output_stream:
        output_stream.writelines(input_stream)


def prepare_conservation_from_msa(
        chains: typing.Set[str], options, input_dir, working_root_dir) \
        -> typing.Dict[str, ConservationTuple]:
    if not len(chains) == 1:
        raise Exception(
            f"Custom MSA can be used only with one chain,"
            f" but {len(chains)} were given.")
    chain = next(iter(chains))
    msa_file = os.path.join(input_dir, options["msaFile"])
    target_file = os.path.join(working_root_dir, f"structure_{chain}.score")
    configuration = conservation.ConservationConfiguration()
    configuration.execute_command = execute_command
    conservation.compute_jensen_shannon_divergence(
        msa_file, target_file, configuration)
    return {chain: ConservationTuple(target_file, msa_file)}


def compute_conservations(
        arguments, structure: StructureTuple) \
        -> typing.Dict[str, ConservationTuple]:
    # As chains may have same sequences, we collect map sequence to chain.
    result = {}
    sequence_to_chain = {}
    for chain, fasta_file_name in structure.fasta_files.items():
        fasta_file = os.path.join(arguments["working"], fasta_file_name)
        sequences = _read_fasta_file(fasta_file)
        if len(sequences) > 1:
            raise Exception(
                "The fasta file must contains only one sequence not {}"
                    .format(len(sequences)))
        sequence = sequences[0][1]
        # If we see the sequence for the first time we compute the conservation.
        if sequence not in sequence_to_chain:
            conservation = compute_from_structure_for_chain(
                chain, fasta_file_name, arguments)
            sequence_to_chain[sequence] = conservation
        # We use the computed conservation for given chain.
        result[chain] = sequence_to_chain[sequence]
    return result


def _read_fasta_file(input_file: str) -> typing.List[typing.Tuple[str, str]]:
    header = None
    result = []
    sequence = ""
    with open(input_file) as in_stream:
        for line in in_stream:
            line = line.rstrip()
            if line.startswith(">"):
                if header is None:
                    header = line[1:]
                else:
                    result.append((header, sequence))
                    header = line[1:]
                    sequence = ""
            else:
                sequence += line
    if header is not None:
        result.append((header, sequence))
    return result


def compute_from_structure_for_chain(
        chain: str, fasta_file_name: str, arguments) -> ConservationTuple:
    working_dir = os.path.join(arguments["working"], f"conservation-{chain}")
    fasta_file = os.path.join(arguments["working"], fasta_file_name)
    os.makedirs(working_dir, exist_ok=True)
    target_file = os.path.join(working_dir, f"chain_{chain}_conservation.score")
    configuration = conservation.ConservationConfiguration()
    configuration.execute_command = execute_command
    configuration.blast_databases = prepare_blast_databases()
    # The following lines show how `conservation_hmm` can be integrated.
    USE_CONSERVATION_HMM = False        # Can be an environmental variable or configuration attribute.
    if USE_CONSERVATION_HMM:
        from conservation_hmm import conservation_hmm       # Can be moved to import section. `conservation_hmm.py` must be in Python search path.
        database_file = os.path.join(blast_database.BLASTDB, "uniprot_sprot.fasta")     # `conservation_hmm` database can be specified as an environmental variable or configuration attribute.
        working_dir = os.path.join(working_dir, "")     # `working_dir` must end with a '/' or other OS' equivalent
        conservation_hmm(fasta_file, database_file, working_dir, target_file)
        return ConservationTuple(target_file, None)     # `msa_file` can be added, but is in STOCKHOLM format.
    # End of the `conservation_hmm` integration example.
    msa_file = conservation.compute_conservation(
        fasta_file, working_dir, target_file, configuration)
    return ConservationTuple(target_file, msa_file)

def prepare_blast_databases() -> typing.List[str]:
    databases = ["swissprot", "uniref50", "uniref90"]
    blast_database.prepare_databases(execute_command, databases)
    return databases

def execute_p2rank(
        arguments, structure_file: str, configuration,
        conservation_files: typing.Dict[str, ConservationTuple]) -> str:
    """Execute p2rank and return output directory."""

    # Prepare inputs.
    input_dir = os.path.join(arguments["working"], "p2rank-input")
    os.makedirs(input_dir, exist_ok=True)
    input_structure_file = os.path.join(input_dir, "structure.pdb")
    shutil.copy(structure_file, input_structure_file)
    prepare_p2rank_conservation_files(input_dir, conservation_files)

    # Prepare command.
    output_dir = os.path.join(arguments["working"], "p2rank-output")
    p2rank_sh = os.path.join(arguments["p2rank"], "p2rank.sh")
    p2rank_config = os.path.join(
        arguments["p2rank"], "config",
        select_p2rank_configuration(configuration))

    command = f"{p2rank_sh} predict " \
              f"-c {p2rank_config} " \
              f"-threads 1 " \
              f"-f {input_structure_file} " \
              f"-o {output_dir} " \
              f"--log_to_console 1"

    execute_command(command)

    return output_dir


def prepare_p2rank_conservation_files(
        p2rank_input_dir: str,
        conservation_files: typing.Dict[str, ConservationTuple]):
    for chain, chain_tuple in conservation_files.items():
        chain_file = os.path.join(
            p2rank_input_dir,
            f"structure{chain.upper()}.hom")
        shutil.copy(chain_tuple.file, chain_file)


def select_p2rank_configuration(configuration) -> str:
    if configuration["conservation"]["compute"]:
        return "conservation"
    else:
        return "default"


def prepare_download_data(
        arguments,
        p2rank_directory: str,
        structure: StructureTuple,
        conservation_files: typing.Dict[str, ConservationTuple]):
    download_dir = os.path.join(arguments["working"], "public")
    os.makedirs(download_dir, exist_ok=True)
    collect_download_data(
        p2rank_directory, structure, conservation_files, download_dir)
    # Pack into archive and remove temporary data.
    zip_directory(
        os.path.join(download_dir),
        os.path.join(arguments["output"], "visualizations.zip"))
    shutil.rmtree(download_dir)


def collect_download_data(
        p2rank_directory: str,
        structure: StructureTuple,
        conservation_files: typing.Dict[str, ConservationTuple],
        output_dir: str
):
    shutil.copytree(
        os.path.join(p2rank_directory, "visualizations"),
        os.path.join(output_dir, "visualizations"),
    )
    shutil.copy(
        os.path.join(p2rank_directory, "structure.pdb_predictions.csv"),
        os.path.join(output_dir, "predictions.csv")
    )
    shutil.copy(
        os.path.join(p2rank_directory, "structure.pdb_residues.csv"),
        os.path.join(output_dir, "residues.csv")
    )
    for chain, item in conservation_files.items():
        if item.msa_file is not None:
            shutil.copy(
                item.msa_file,
                os.path.join(output_dir, "msa_" + chain + ".fasta")
            )
        shutil.copy(
            item.file,
            os.path.join(output_dir, "conservation_" + chain + ".hom")
        )


def zip_directory(directory_to_zip: str, output: str):
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as stream:
        for root, dirs, files in os.walk(directory_to_zip):
            for file in files:
                path_in_zip = os.path.relpath(
                    os.path.join(root, file),
                    os.path.join(directory_to_zip))
                stream.write(os.path.join(root, file), path_in_zip)


def gzip_file(source: str, target: str):
    with open(source, "rb") as input_stream, \
            gzip.open(target, "wb") as output_stream:
        output_stream.writelines(input_stream)


def prepare_p2rank_web_data(
        p2rank_directory: str,
        structure: StructureTuple,
        conservation_files: typing.Dict[str, ConservationTuple],
        output_directory):
    predictions_file = \
        os.path.join(p2rank_directory, "structure.pdb_predictions.csv")

    residues_file = \
        os.path.join(p2rank_directory, "structure.pdb_residues.csv")

    shutil.copy(
        structure.file,
        os.path.join(output_directory, "structure.pdb")
    )

    conservation_args = ""
    if len(conservation_files) > 0:
        conservation_args = " --conservation " + \
                            " --conservation ".join([
                                f"{chain}={item.file}" for chain, item in
                                conservation_files.items()
                            ])

    command = f"{PROTEIN_UTILS_CMD} PrepareForPrankWeb" \
              f" --structure={structure.raw_file}" \
              f" --prediction={predictions_file}" \
              f" --residues={residues_file}" \
              f" --output={output_directory}" \
              f" {conservation_args}"

    execute_command(command)


if __name__ == "__main__":
    main(_read_arguments())
