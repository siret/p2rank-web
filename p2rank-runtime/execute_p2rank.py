#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Command examples:
# python3 execute_p2rank.py --p2rank /opt/p2rank/p2rank_2.1 --input ./examples --working ./working-000 --output ./public-000 --configuration ./examples/code.json
#   Just PDB code with no chain provided.
# python3 execute_p2rank.py --p2rank /opt/p2rank/p2rank_2.1 --input ./examples --working ./working-001 --output ./public-001 --configuration ./examples/code-conservation.json
#   PDB code with chain "A" using conservation.
# python3 execute_p2rank.py --p2rank /opt/p2rank/p2rank_2.1 --input ./examples --working ./working-002 --output ./public-002 --configuration ./examples/code-conservation-msa.json
#   PDB code with chain "A" using custom MSA.
# python3 execute_p2rank.py --p2rank /opt/p2rank/p2rank_2.1 --input ./examples --working ./working-003 --output ./public-003 --configuration ./examples/file-conservation-hssp.json
#   PDB file with conservation from HSSP.
# python3 execute_p2rank.py --p2rank /opt/p2rank/p2rank_2.1 --input ./examples --working ./working-004 --output ./public-004 --configuration ./examples/file-conservation-msa.json
#   PDB file with chain "A" using custom MSA.
# python3 execute_p2rank.py --p2rank /opt/p2rank/p2rank_2.1 --input ./examples --working ./working-005 --output ./public-005 --configuration ./examples/file-conservation.json
#   PDB file with conservation.
# python3 execute_p2rank.py --p2rank /opt/p2rank/p2rank_2.1 --input ./examples --working ./working-006 --output ./public-006 --configuration ./examples/file.json
#   Just PDB file.
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

import requests
import Bio.PDB

import conservation

PROTEIN_UTILS_CMD = os.environ["PROTEIN_UTILS_CMD"]

HSSP_DATABASE_DIR = os.environ["HSSPTDB"]


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
                        help="p2rank root directory")
    return vars(parser.parse_args())


def main(arguments):
    # Setup.
    conservation.execute_command = execute_command
    #
    prepare_directories(arguments)
    init_logging()
    configuration = load_json(arguments["configuration"])
    structure_file, chains = prepare_structure(arguments, configuration)
    conservation_files = prepare_conservation(
        structure_file, chains, configuration, arguments)

    print("Configuration:", configuration)
    print("Structure    :", structure_file)
    print("Conservation :", conservation_files)

    p2rank_output = execute_p2rank(
        arguments, structure_file, configuration, conservation_files)

    process_p2rank_output(
        structure_file, p2rank_output, arguments["output"], conservation_files)


def init_logging() -> None:
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] - %(message)s",
        datefmt="%m/%d/%Y %H:%M:%S")


def prepare_directories(arguments):
    os.makedirs(arguments["working"], exist_ok=True)
    os.makedirs(arguments["output"], exist_ok=True)


def load_json(path: str) -> typing.Dict:
    with open(path) as stream:
        return json.load(stream)


def prepare_structure(arguments, configuration) -> [str, typing.Set[str]]:
    logging.info("Preparing structure ...")
    structure = configuration["structure"]
    structure_file = os.path.join(arguments["working"], "structure.pdb")
    prepare_raw_structure_file(arguments, structure, structure_file)
    available_chains = get_structure_chains(structure_file)

    chains = structure.get("chain", None)
    result_path = os.path.join(arguments["output"], "structure.pdb")
    if chains is None or len(chains) == 0:
        logging.info("Using whole structure file.")
        shutil.copy(structure_file, result_path)
        return result_path, available_chains

    requested_chains = {item for item in chains.split(",") if item}
    if not requested_chains.issubset(available_chains):
        raise Exception(
            f"Requested chains {list(requested_chains)} but only"
            f"{list(available_chains)} are available.")

    execute_command(
        f"{PROTEIN_UTILS_CMD} -a filter-by-chain"
        f" --structure {structure_file}"
        f" --output {result_path}"
        f" --chains {','.join(requested_chains)}")

    logging.info("Preparing structure ... done")
    logging.debug(f"Path: {result_path}")
    logging.debug(f"Chains: {' '.join(requested_chains)}")
    return result_path, requested_chains


def prepare_raw_structure_file(arguments, structure, structure_file: str):
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


def get_structure_chains(structure_file: str):
    logging.debug("Reading chains ...")
    parser = Bio.PDB.PDBParser()
    structure = parser.get_structure("structure", structure_file)

    model_count = len(structure)
    if not model_count == 1:
        raise Exception(
            f"The structure file must contain exactly one model, "
            f"but contains {model_count}")

    available_chains = {chain.id for model in structure for chain in model}
    logging.debug(f"Reading chains ... done")
    return available_chains


def download(url: str, destination: str) -> None:
    logging.debug(f"Downloading '{url}' to '{destination}' ...")
    response = requests.get(url)
    with open(destination, "wb") as stream:
        stream.write(response.content)


def execute_command(command: str):
    logging.debug("Executing '%s'", command)
    subprocess.run(command, shell=True, env=os.environ.copy())


def prepare_conservation(
        structure_file: str, chains: typing.Set[str],
        configuration, arguments) \
        -> typing.Dict[str, str]:
    if "conservation" not in configuration \
            or not configuration["conservation"].get("compute", False):
        logging.info("No conservation is used.")
        return dict()
    conservation_options = configuration["conservation"]
    if conservation_options.get("hssp", None) is not None:
        return prepare_conservation_from_hssp(
            conservation_options, arguments["working"], chains)
    elif conservation_options.get("msaFile", None) is not None:
        return prepare_conservation_from_msa(
            chains, conservation_options,
            arguments["input"], arguments["working"])
    else:
        return compute_from_structure(structure_file, chains, arguments)


def prepare_conservation_from_hssp(
        conservation_options, working_dir: str,
        chains: typing.Set[str]) -> typing.Dict[str, str]:
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
        result[chain] = target_file
    return result


def gunzip_file(source: str, target: str):
    with gzip.open(source, "rb") as input_stream, \
            open(target, "wb") as output_stream:
        output_stream.writelines(input_stream)


def prepare_conservation_from_msa(
        chains: typing.Set[str], options, input_dir, working_root_dir) \
        -> typing.Dict[str, str]:
    if not len(chains) == 1:
        raise Exception(
            f"Custom MSA can be used only with one chain,"
            f" but {len(chains)} were given.")
    chain = next(iter(chains))
    msa_file = os.path.join(input_dir, options["msaFile"])
    target_file = os.path.join(working_root_dir, f"structure_{chain}.score")
    conservation.compute_jensen_shannon_divergence(msa_file, target_file)
    return {chain: target_file}


def compute_from_structure(
        structure_file: str, chains: typing.Set[str], arguments) \
        -> typing.Dict[str, str]:
    return {
        chain: compute_from_structure_for_chain(
            structure_file, chain, arguments)
        for chain in chains
    }


def compute_from_structure_for_chain(
        structure_file: str, chain: str, arguments) -> str:
    working_dir = os.path.join(arguments["working"], f"conservation-{chain}")
    fasta_file = os.path.join(working_dir, "sequence.fasta")
    os.makedirs(working_dir, exist_ok=True)

    # Extract FASTA file.
    execute_command(
        f"{PROTEIN_UTILS_CMD} "
        f"-a extract-chain-sequence "
        f" --structure {structure_file}"
        f" --output {fasta_file}"
        f" --chain {chain}")

    target_file = os.path.join(working_dir, f"structure_{chain}.score")
    conservation.compute_conservation(fasta_file, working_dir, target_file)
    return target_file


def execute_p2rank(
        arguments,
        structure_file: str,
        configuration,
        conservation_files: typing.Dict[str, str]) -> str:
    """Execute p2rank and return output directory."""

    # Prepare inputs.
    input_dir = os.path.join(arguments["working"], "p2rank-input")
    os.makedirs(input_dir)
    input_structure_file = os.path.join(input_dir, "structure.pdb")
    shutil.copy(structure_file, input_structure_file)
    prepare_p2rank_conservation_files(input_dir, conservation_files)

    # Prepare command.
    output_dir = os.path.join(arguments["working"], "p2rank-output")
    p2rank_config = os.path.join(
        arguments["p2rank"], "config",
        select_p2rank_configuration(configuration))

    command = f"./p2rank.sh predict " \
              f"-c {p2rank_config} " \
              f"-threads 1 " \
              f"-f {structure_file} " \
              f"-o {output_dir} " \
              f"--log_to_console 1"

    execute_command(command)

    return output_dir


def prepare_p2rank_conservation_files(
        input_dir: str, conservation_files: typing.Dict[str, str]):
    for chain, chain_file in conservation_files.items():
        input_chain_file = os.path.join(
            input_dir, f"structure{chain}pdb.seq.fasta.hom.gz")
        gzip_file(chain_file, input_chain_file)


def select_p2rank_configuration(configuration) -> str:
    if configuration["conservation"]["compute"]:
        return "conservation"
    else:
        return "default"


def gzip_file(source: str, target: str):
    with open(source, "rb") as input_stream, \
            gzip.open(target, "wb") as output_stream:
        output_stream.writelines(input_stream)


def process_p2rank_output(
        structure_file: str, p2rank_directory: str, output_directory: str,
        conservation_files: typing.Dict[str, str]):
    zip_directory(
        os.path.join(p2rank_directory, "visualizations"),
        os.path.join(output_directory, "visualizations.zip"))

    predictions_file = \
        os.path.join(p2rank_directory, "structure.pdb_predictions.csv")
    residues_file = \
        os.path.join(p2rank_directory, "structure.pdb_residues.csv")

    output_prediction_file = os.path.join(output_directory, "prediction.json")
    output_sequence_file = os.path.join(output_directory, "sequence.json")

    conservation_args = ""
    if len(conservation_files) > 0:
        conservation_args = " --conservation " + \
                            " --conservation ".join([
                                f"{chain}={file}" for chain, file in
                                conservation_files.items()
                            ])

    command = f"{PROTEIN_UTILS_CMD} -a p2rank-web" \
              f" --structure={structure_file}" \
              f" --prediction={predictions_file}" \
              f" --residues={residues_file}" \
              f" --output-pocket={output_prediction_file}" \
              f" --output-sequence={output_sequence_file}" \
              f" {conservation_args}"

    execute_command(command)


def zip_directory(directory_to_zip: str, output: str):
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as stream:
        for root, dirs, files in os.walk(directory_to_zip):
            for file in files:
                path_in_zip = os.path.relpath(
                    os.path.join(root, file),
                    os.path.join(directory_to_zip))
                stream.write(os.path.join(root, file), path_in_zip)


if __name__ == "__main__":
    main(_read_arguments())
