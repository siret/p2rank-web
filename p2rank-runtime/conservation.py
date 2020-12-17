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

import multiple_sequence_alignment as msa

JENSE_SHANNON_DIVERGANCE_DIR = os.environ["JENSE_SHANNON_DIVERGANCE_DIR"]

PSIBLAST_CMD = os.environ["PSIBLAST_CMD"]

BLASTDBCMD_CMD = os.environ["BLASTDBCMD_CMD"]

CDHIT_CMD = os.environ["CDHIT_CMD"]

MUSCLE_CMD = os.environ["MUSCLE_CMD"]


class ConservationConfiguration:
    # See multiple_sequence_alignment.MsaConfiguration for more details.
    msa_minimum_sequence_count: int = 50
    # See multiple_sequence_alignment.MsaConfiguration for more details.
    msa_minimum_coverage: int = 80
    # See multiple_sequence_alignment.MsaConfiguration for more details.
    msa_maximum_sequences: int = 60
    # Execute command.
    execute_command: typing.Callable[[str], None]


def compute_conservation(
        input_file: str, working_dir: str, output_file: str,
        config: ConservationConfiguration) -> str:
    """Compute conversation to given file, return path to utilized MSA file."""
    msa_file = os.path.join(working_dir, "msa")
    _compute_msa(input_file, working_dir, msa_file, config)
    compute_jensen_shannon_divergence(msa_file, output_file, config)
    return msa_file


def _compute_msa(
        fasta_file: str, working_dir: str, output_file: str,
        config: ConservationConfiguration):
    """Compute MSA for given fasta file and save output to given file.

    Result can be used by compute_jensen_shannon_divergence method.
    """
    msa_config = msa.MsaConfiguration()
    msa_config.minimum_sequence_count = config.msa_minimum_sequence_count
    msa_config.minimum_coverage = config.msa_minimum_coverage
    msa_config.maximum_sequences_for_msa = config.msa_maximum_sequences
    msa_config.blast_databases.append(msa.BlastDatabase("swissprot"))
    msa_config.blast_databases.append(msa.BlastDatabase("uniref50"))
    msa_config.blast_databases.append(msa.BlastDatabase("uniref90"))
    msa_config.working_dir = working_dir
    msa_config.execute_psiblast = \
        _create_execute_psiblast(config.execute_command)
    msa_config.execute_blastdb = \
        _create_execute_blastdbcmd(config.execute_command)
    msa_config.execute_cdhit = \
        _create_execute_cdhit(config.execute_command)
    msa_config.execute_muscle = \
        _create_execute_muscle(config.execute_command)
    #
    msa.compute_msa(fasta_file, output_file, msa_config)


def _create_execute_psiblast(execute_command):
    """Search for similar sequences using PSI-BLAST."""

    def execute_psiblast(
            input_file: str,
            output_file: str,
            database: msa.BlastDatabase):
        output_format = "6 sallseqid qcovs pident"
        cmd = "{} < {} -db {} -outfmt '{}' -evalue 1e-5 > {}".format(
            PSIBLAST_CMD, input_file, database.name, output_format, output_file)
        logging.debug("Executing PSI-BLAST ...")
        execute_command(cmd)

    return execute_psiblast


def _create_execute_blastdbcmd(execute_command):
    """Retrieve sequences from database."""

    def execute_blastdbcmd(
            input_file: str,
            sequence_file: str,
            database: msa.BlastDatabase):
        cmd = "{} -db {} -entry_batch {} > {}".format(
            BLASTDBCMD_CMD, database.name, input_file, sequence_file)
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
    sanitize_jensen_shannon_divergence_input(
        input_file, sanitized_input_file)
    cmd = "cd {} && python2 score_conservation.py {} > {}".format(
        JENSE_SHANNON_DIVERGANCE_DIR,
        os.path.abspath(sanitized_input_file),
        os.path.abspath(output_file))
    logging.info("Executing Jense Shannon Divergence script ...")
    logging.debug("Executing command:\n%s", cmd)
    config.execute_command(cmd)
    return output_file


def sanitize_jensen_shannon_divergence_input(input_file: str, output_file: str):
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
