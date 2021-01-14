#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Compute conservation from MSA using
# https://compbio.cs.princeton.edu/conservation/.
#
# Required environment variables:
#   * JENSE_SHANNON_DIVERGANCE_DIR  = conservation_code/
#   * PSIBLAST_CMD                  = ncbi-blast-2.9.0+/bin/psiblast
#   * BLASTDBCMD_CMD                = ncbi-blast-2.9.0+/bin/blastdbcmd
#   * CDHIT_CMD                     = cd-hit-v4.8.1-2019-0228/cd-hit
#   * MUSCLE_CMD                    = muscle3.8.31_i86linux64
#
# Workflow:
#   input-sequence.fasta
#   multiple_sequence_alignment -> compute_msa
#   structure_{chain}.score     -> compute_jensen_shannon_divergence
#

import os
import typing
import logging
import argparse
import subprocess
import shutil

import multiple_sequence_alignment as msa
import blast_database

JENSE_SHANNON_DIVERGANCE_DIR = \
    os.environ.get("JENSE_SHANNON_DIVERGANCE_DIR", None)

PSIBLAST_CMD = \
    os.environ.get("PSIBLAST_CMD", None)

BLASTDBCMD_CMD = \
    os.environ.get("BLASTDBCMD_CMD", None)

CDHIT_CMD = \
    os.environ.get("CDHIT_CMD", None)

MUSCLE_CMD = \
    os.environ.get("MUSCLE_CMD", None)


class ConservationConfiguration:
    # See multiple_sequence_alignment.MsaConfiguration for more details.
    msa_minimum_sequence_count: int = 30
    # See multiple_sequence_alignment.MsaConfiguration for more details.
    msa_minimum_coverage: int = 70
    # See multiple_sequence_alignment.MsaConfiguration for more details.
    msa_maximum_sequences: int = 70
    # Execute command.
    execute_command: typing.Callable[[str], None]
    # Name of BLAST databases used to compute MSA.
    blast_databases: typing.List[str] = None


def _read_arguments() -> typing.Dict[str, str]:
    parser = argparse.ArgumentParser(
        description="Compute conservation scores for given sequences.")
    parser.add_argument(
        "--input", required=True,
        help="Input FASTA file.")
    parser.add_argument(
        "--working", required=True,
        help="Working directory.")
    parser.add_argument(
        "--output", required=True,
        help="Output conservation file.")
    parser.add_argument(
        "--database", metavar="D",
        default=["swissprot", "uniref50", "uniref90"],
        type=str, nargs="+",
        help="BLAST databases used for MSA computation.")
    return vars(parser.parse_args())


def main(arguments):
    _init_logging()
    if os.path.exists(arguments["output"]):
        logging.info("Output file already exists.")
        return
    config = ConservationConfiguration()
    config.blast_databases = arguments["database"]
    config.execute_command = _default_execute_command
    os.makedirs(arguments["working"], exist_ok=True)
    compute_conservation(
        arguments["input"], arguments["working"], arguments["output"],
        config)
    shutil.rmtree(arguments["working"])


def _init_logging() -> None:
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] - %(message)s",
        datefmt="%m/%d/%Y %H:%M:%S")

def _default_execute_command(command: str):
    result = subprocess.run(command, shell=True, env=os.environ.copy())
    # Throw for non-zero (failure) return code.
    result.check_returncode()


def compute_conservation(
        input_file: str, working_dir: str, output_file: str,
        config: ConservationConfiguration) -> str:
    """Compute conversation to given file, return path to utilized MSA file."""
    msa_file = os.path.join(working_dir, "msa")
    msa_config = create_msa_configuration(working_dir, config)
    msa.compute_msa(input_file, msa_file, msa_config)
    compute_jensen_shannon_divergence(msa_file, output_file, config)
    return msa_file


def create_msa_configuration(
        working_dir: str, config: ConservationConfiguration) \
        -> msa.MsaConfiguration:
    result = msa.MsaConfiguration()
    result.minimum_sequence_count = config.msa_minimum_sequence_count
    result.minimum_coverage = config.msa_minimum_coverage
    result.maximum_sequences_for_msa = config.msa_maximum_sequences
    result.blast_databases = config.blast_databases
    result.working_dir = working_dir
    result.execute_psiblast = \
        _create_execute_psiblast(config.execute_command)
    result.execute_blastdb = \
        _create_execute_blastdbcmd(config.execute_command)
    result.execute_cdhit = \
        _create_execute_cdhit(config.execute_command)
    result.execute_muscle = \
        _create_execute_muscle(config.execute_command)
    return result


def _create_execute_psiblast(execute_command):
    """Search for similar sequences using PSI-BLAST."""

    def execute_psiblast(
            input_file: str,
            output_file: str,
            database: str):
        output_format = "6 sallseqid qcovs pident"
        cmd = "{} < {} -db {} -outfmt '{}' -evalue 1e-5 > {}".format(
            PSIBLAST_CMD, input_file, database, output_format, output_file)
        logging.debug("Executing PSI-BLAST ...")
        execute_command(cmd)

    return execute_psiblast


def _create_execute_blastdbcmd(execute_command):
    """Retrieve sequences from database."""

    def execute_blastdbcmd(
            input_file: str,
            sequence_file: str,
            database: str):
        cmd = "{} -db {} -entry_batch {} > {}".format(
            BLASTDBCMD_CMD, database, input_file, sequence_file)
        logging.debug("Executing BLAST ...")
        execute_command(cmd)

    return execute_blastdbcmd


def _create_execute_cdhit(execute_command):
    def execute_cdhit(input_file: str, output_file: str, log_file: str):
        cmd = "{} -i {} -o {} > {}".format(
            CDHIT_CMD, input_file, output_file, log_file)
        logging.debug("Executing CD-HIT ..")
        execute_command(cmd)

    return execute_cdhit


def _create_execute_muscle(execute_command):
    def execute_muscle(input_file: str, output_file: str):
        cmd = "cat {} | {} -quiet > {}".format(
            input_file, MUSCLE_CMD, output_file)
        logging.info("Executing muscle ...")
        execute_command(cmd)

    return execute_muscle


def compute_jensen_shannon_divergence(
        input_file: str, output_file: str,
        config: ConservationConfiguration) -> str:
    """Input sequence must be on the first position."""
    sanitized_input_file = input_file + ".sanitized"
    _sanitize_jensen_shannon_divergence_input(
        input_file, sanitized_input_file)
    cmd = "cd {} && python2 score_conservation.py {} > {}".format(
        JENSE_SHANNON_DIVERGANCE_DIR,
        os.path.abspath(sanitized_input_file),
        os.path.abspath(output_file))
    logging.info("Executing Jense Shannon Divergence script ...")
    logging.debug("Executing command:\n%s", cmd)
    config.execute_command(cmd)
    return output_file


def _sanitize_jensen_shannon_divergence_input(input_file: str,
                                              output_file: str):
    """Chain names such as '>pdb|2SRC|Chain A' lead to

    File "score_conservation.py", line 599, in load_sequence_weights
    seq_weights.append(float(l[1]))
    ValueError: could not convert string to float: A

    As output of the jensen_shannon_divergence does not use the names,
    we replace all spaces with '_' in chain names.
    """
    with open(input_file, "r") as in_stream, \
            open(output_file, "w", newline="") as out_stream:
        for line in in_stream:
            if line.startswith(">"):
                line = line.replace(" ", "_")
            out_stream.write(line)


if __name__ == "__main__":
    main(_read_arguments())
