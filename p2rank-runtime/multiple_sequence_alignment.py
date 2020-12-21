#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Given a sequence in a FASTA file compute MSA.
#
# Workflow:
#   input-sequence.fasta
#   psiblast                    -> _execute_psiblast
#                                   Query for similar proteins.
#   psiblast-filtered           -> _filter_psiblast_file
#                                   Filter proteins by similarity.
#   blastdb-output              -> _execute_blastdbcmd
#                                   Get sequences for the proteins.
#   blast-output                -> _execute_cdhit
#                                   Cluster sequences and select
#                                   representatives.
#   muscle-input                -> _merge_files([sequence_file, fasta_file], ..)
#                                   Add the input sequence to the
#                                   found sequences.
#   muscle-output               -> _compute_msa_for_sequences
#                                   Apply muscle to get MSA.
#   msa                         -> _order_muscle_result
#                                   Reorder sequences and put the
#                                   input sequence first.
#

import os
import typing
import logging
import math

class BlastDatabase:
    # Name of a database, e.g. "swissprot", "uniref90".
    name: str

    def __init__(self, name: str):
        self.name = name


class MsaConfiguration:
    # Prefix used to identify the sequence.
    sequence_prefix: str = "query_sequence|"
    # Amount of sequences after filtering that need to be found, if not
    # enough sequences are found then try another database.
    minimum_sequence_count: int
    # Minimum required coverage for similar sequences in percents.
    minimum_coverage: int
    # Limit how many sequences are used to compute MSA. Use 0 for no limit.
    maximum_sequences_for_msa: int
    # List of databases used to search for multisequence alignment.
    blast_databases: typing.List[BlastDatabase] = []
    # Path to a working directory.
    working_dir: str
    # Execute psiblast for given files.
    # Arguments: input file, output file, database
    execute_psiblast: typing.Callable[[str, str, BlastDatabase], None]
    # Execute psiblast for given files.
    # Arguments: input file, output file, database
    execute_blastdb: typing.Callable[[str, str, BlastDatabase], None]
    # Execute psiblast for given files.
    # Arguments: sequences files, output file, log file
    execute_cdhit: typing.Callable[[str, str, str, ], None]
    # Execute psiblast for given files.
    # Arguments: input file, output file
    execute_muscle: typing.Callable[[str, str], None]


def compute_msa(
        fasta_file: str, output_file: str, config: MsaConfiguration):
    blast_input = _prepare_blast_input(fasta_file, config)
    blast_output = os.path.join(config.working_dir, "blast-output")
    _find_similar_sequences(blast_input, blast_output, config)
    muscle_file = os.path.join(config.working_dir, "muscle-output")
    _compute_msa_for_sequences(
        blast_input, blast_output, muscle_file, config)
    _prepare_for_conservation(muscle_file, output_file, config)
    config.maximum_sequences_for_msa = 1


# region Prepare Blast input

def _prepare_blast_input(
        fasta_file: str, config: MsaConfiguration) -> str:
    """Prepare FASTA file pro Blast.

    Mare sure there is only one sequence in the file. Add recognizable header
    to the sequence name and save it to a file.
    """
    sequences = _read_fasta_file(fasta_file)
    if len(sequences) != 1:
        raise Exception(
            "The input file must contains only one sequence not {}"
                .format(len(sequences)))
    blast_input = os.path.join(
        config.working_dir, "input-sequence.fasta")
    _save_sequence_to_fasta(
        config.sequence_prefix + sequences[0][0],
        sequences[0][1], blast_input)
    return blast_input


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


def _save_sequence_to_fasta(header: str, sequence: str, output_file: str):
    with open(output_file, "w") as out_stream:
        out_stream.write(_format_fasta_sequence(header, sequence))


def _format_fasta_sequence(header: str, sequence: str, line_width: int = 80):
    lines = '\n'.join([
        sequence[index:index + line_width]
        for index in range(0, len(sequence), line_width)
    ])
    return f">{header}\n{lines}\n"


# endregion

# region Find similar sequences

def _find_similar_sequences(
        input_file: str, output_file: str, config: MsaConfiguration):
    """
    Try to find sufficient amount of similar sequences in databases.
    """
    for database in config.blast_databases:
        found = _find_similar_sequences_in_database(
            input_file, output_file, config, database)
        if found:
            return
    raise Exception("Not enough similar sequences found!")


def _find_similar_sequences_in_database(
        input_file: str, output_file: str,
        config: MsaConfiguration, database: BlastDatabase) -> bool:
    logging.info(
        "Searching for similar sequences using psiblast on '%s' database ...",
        database.name)
    psiblast = os.path.join(config.working_dir, "psiblast")
    config.execute_psiblast(input_file, psiblast, database)
    logging.info(
        "Filtering result to match required criteria...")
    psiblast_filtered = os.path.join(
        config.working_dir, "psiblast-filtered")
    filtered_count = _filter_psiblast_file(
        psiblast, psiblast_filtered, config)
    if filtered_count < config.minimum_sequence_count:
        logging.info("Not enough sequences.")
        return False
    logging.info("Retrieving content of sequences ...")
    sequences = os.path.join(config.working_dir, "blastdb-output")
    config.execute_blastdb(psiblast_filtered, sequences, database)
    # Cluster and select representatives.
    logging.info("Selecting representative sequences ...")
    cdhit_log_file = os.path.join(config.working_dir, "cd-hit.log")
    cdhit_output_file = os.path.join(config.working_dir, "cd-hit")
    config.execute_cdhit(sequences, cdhit_output_file, cdhit_log_file)
    if not _found_enough_sequences(cdhit_output_file, config):
        return False
    _select_sequences(
        cdhit_output_file, output_file,
        config.maximum_sequences_for_msa)
    return True


def _filter_psiblast_file(
        input_file: str, output_file: str, config: MsaConfiguration
) -> int:
    inputs_count = 0
    results_count = 0
    with open(input_file) as in_stream, open(output_file, "w") as out_stream:
        for line in in_stream:
            inputs_count += 1
            identifier, coverage, identity = line.rstrip().split("\t")
            if float(coverage) < config.minimum_coverage:
                continue
            if not (30 <= float(identity) <= 95):
                continue
            out_stream.write(identifier)
            out_stream.write("\n")
            results_count += 1
    logging.info("Filtering results from %s to %s", inputs_count, results_count)
    return results_count


def _found_enough_sequences(
        fasta_file: str, config: MsaConfiguration) -> bool:
    counter = 0
    for _, _ in _read_fasta_file(fasta_file):
        counter += 1
    logging.info("Number of sequences in %s is %s", fasta_file, counter)
    return counter > config.minimum_sequence_count


def _select_sequences(input_file: str, output_file: str, count: int):
    """
    Keep only first N of sequences.
    """
    sequences = _read_fasta_file(input_file)
    if 0 < count < len(sequences):
        filtered_sequence = [
            sequences[index] 
            for index in uniform_sample(0, len(sequences), count)]
        logging.info("Using %s from %s sequences", 
            len(filtered_sequence), len(sequences))
        sequences = filtered_sequence
    # Write only selected.
    with open(output_file, "w") as out_stream:
        for (header, sequence) in sequences:
            out_stream.write(_format_fasta_sequence(header, sequence))


def uniform_sample(start, end, total_count):
    step = end / total_count
    count = 0
    index = start
    while index < end and count < total_count:
        yield int(index)
        index += step
        count += 1


# endregion

def _compute_msa_for_sequences(
        fasta_file: str, sequence_file: str, output_file: str,
        config: MsaConfiguration):
    muscle_input = os.path.join(config.working_dir, "muscle-input")
    _merge_files([sequence_file, fasta_file], muscle_input)
    config.execute_muscle(muscle_input, output_file)


def _merge_files(input_files: typing.List[str], output_file: str):
    with open(output_file, "w") as out_stream:
        for input_file in input_files:
            with open(input_file) as in_stream:
                for line in in_stream:
                    out_stream.write(line)


def _prepare_for_conservation(
        input_file: str, output_file: str, config: MsaConfiguration):
    """
    Put the marked sequence at the top of the file and change it's header,
    and fix some issues.
    """
    logging.info("Ordering muscle results ...")
    first_header = None
    first_sequence = None
    for header, sequence in _read_fasta_file(input_file):
        if header.startswith(config.sequence_prefix):
            # We can remove the prefix here
            first_header = header[len(config.sequence_prefix):]
            first_sequence = sequence
            break

    if first_header is None:
        raise Exception(
            "Missing header '" + config.sequence_prefix +
            "' in " + input_file)

    with open(output_file, "w", newline="\n") as out_stream:
        out_stream.write(
            _format_fasta_sequence(first_header, first_sequence, 60))
        for header, sequence in _read_fasta_file(input_file):
            if header.startswith(config.sequence_prefix):
                continue
            out_stream.write(_format_fasta_sequence(header, sequence, 60))
