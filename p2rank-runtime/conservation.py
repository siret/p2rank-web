#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Compute conservation from MSA using
# https://compbio.cs.princeton.edu/conservation/.
# The MSA can be computed from FASTA sequence file.
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
#   structure_{chain}.score     -> compute_jensen_shannon_divergence
#

import os
import typing
import logging

MARK_SEQUENCE_PREFIX = "query_sequence|"

MIN_SEQUENCE_COUNT = 50

JENSE_SHANNON_DIVERGANCE_DIR = os.environ["JENSE_SHANNON_DIVERGANCE_DIR"]
PSIBLAST_CMD = os.environ["PSIBLAST_CMD"]
BLASTDBCMD_CMD = os.environ["BLASTDBCMD_CMD"]
CDHIT_CMD = os.environ["CDHIT_CMD"]
MUSCLE_CMD = os.environ["MUSCLE_CMD"]


class MsaConfiguration:
    """
    Amount of sequences after filtering that need to be found, if not
    enough sequences are found then try another database.
    """
    minimum_sequence_count: int = 50
    """
    Minimum required coverage for similar sequences in percents.
    """
    minimum_coverage: int = 80
    """
    Limit how many sequences are used to compute MSA. Use 0 for no limit.
    """
    maximum_sequences_for_msa: int = 0


execute_command: typing.Callable[[str], None] = lambda cmd: None


def compute_conservation(
        input_file: str, working_dir: str, output_file: str,
        configuration: MsaConfiguration) -> str:
    """Compute conversation to given file, return path to utilized MSA file."""
    msa_file = os.path.join(working_dir, "msa")
    compute_msa(input_file, working_dir, msa_file, configuration)
    compute_jensen_shannon_divergence(msa_file, output_file)
    return msa_file


def compute_msa(
        fasta_file: str, working_dir: str, output_file: str,
        configuration: MsaConfiguration
) -> None:
    """Compute MSA for given fasta file and save output to given file.

    Use blast to find similar sequences and muscle to compute MSA. At the
    end the results are ordered and prepared for the next step.
    """
    blast_input = _prepare_blast_input(fasta_file, working_dir)
    blast_file = os.path.join(working_dir, "blast-output")
    _find_similar_sequences(blast_input, blast_file, working_dir, configuration)
    muscle_file = os.path.join(working_dir, "muscle-output")
    _compute_msa_for_sequences(
        blast_input, blast_file, muscle_file, working_dir)
    _prepare_for_conservation(muscle_file, output_file)


# region Prepare Blast input

def _prepare_blast_input(fasta_file: str, working_dir: str) -> str:
    """Prepare FASTA file pro Blast.

    Mare sure there is only one sequence in the file. Add recognizable header
    to the sequence name and save it to a file.
    """
    sequences = _read_fasta_file(fasta_file)
    if len(sequences) != 1:
        raise Exception(
            "The input file must contains only one sequence not {}"
                .format(len(sequences)))
    blast_input = os.path.join(working_dir, "input-sequence.fasta")
    _save_sequence_to_fasta(
        MARK_SEQUENCE_PREFIX + sequences[0][0], sequences[0][1], blast_input)
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


def _save_sequence_to_fasta(
        header: str, sequence: str, output_file: str) -> None:
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
        input_file: str, output_file: str, working_dir: str,
        configuration: MsaConfiguration) -> None:
    """
    Try to find sufficient amount of similar sequences in databases.
    """
    found_is_swissprot = _find_similar_sequences_in_database(
        input_file, output_file, working_dir, "swissprot",
        configuration)
    if found_is_swissprot:
        return
    found_in_uniref90 = _find_similar_sequences_in_database(
        input_file, output_file, working_dir, "uniref90",
        configuration)
    if found_in_uniref90:
        return
    raise Exception("Not enough similar sequences found!")


def _find_similar_sequences_in_database(
        pdb_file: str, output_file: str, working_dir: str, database: str,
        configuration: MsaConfiguration) -> bool:
    # Find similar sequences.
    logging.info("Running psiblast on '%s' database ...", database)
    psiblast_file = os.path.join(working_dir, "psiblast")
    _execute_psiblast(pdb_file, psiblast_file, database)
    # Filter results.
    logging.info("Filtering files ...")
    psiblast_file_filtered = os.path.join(working_dir, "psiblast-filtered")
    filtered_count = _filter_psiblast_file(
        psiblast_file, psiblast_file_filtered)
    if filtered_count < configuration.minimum_sequence_count:
        logging.info("Not enough sequences: %s", filtered_count)
        return False
    # Get sequences for results from previous step.
    logging.info("Running blastdbcmd ...")
    sequences_file = os.path.join(working_dir, "blastdb-output")
    _execute_blastdbcmd(psiblast_file_filtered, sequences_file, database)
    # Cluster and select representatives.
    logging.info("Running cd-hit ...")
    cdhit_log_file = os.path.join(working_dir, "cd-hit.log")
    cdhit_output_file = os.path.join(working_dir, "cd-hit-output")
    _execute_cdhit(sequences_file, cdhit_output_file, cdhit_log_file)
    if not _enough_blast_results(output_file, configuration):
        return False
    _select_sequences(
        cdhit_output_file, output_file,
        configuration.maximum_sequences_for_msa)
    return True


def _execute_psiblast(pdb_file: str, output_file: str, database: str) -> None:
    """Search for similar sequences using PSI-BLAST."""
    output_format = "6 sallseqid qcovs pident"
    cmd = "{} < {} -db {} -outfmt '{}' -evalue 1e-5 > {}".format(
        PSIBLAST_CMD, pdb_file, database, output_format, output_file)
    logging.debug("Executing PSI-BLAST ...")
    execute_command(cmd)


def _filter_psiblast_file(
        input_file: str, output_file: str, configuration: MsaConfiguration):
    results_count = 0
    with open(input_file) as in_stream, open(output_file, "w") as out_stream:
        for line in in_stream:
            identifier, coverage, identity = line.rstrip().split("\t")
            if float(coverage) < configuration.minimum_coverage:
                continue
            if not (30 <= float(identity) <= 95):
                continue
            out_stream.write(identifier)
            out_stream.write("\n")
            results_count += 1
    return results_count


def _execute_blastdbcmd(
        psiblast_output_file: str, sequence_file: str, database: str) -> None:
    """Retrieve sequences from database."""
    cmd = "{} -db {} -entry_batch {} > {}".format(
        BLASTDBCMD_CMD, database, psiblast_output_file,
        sequence_file)
    logging.debug("Executing BLAST ...")
    execute_command(cmd)


def _execute_cdhit(input_file: str, output_file: str, log_file: str) -> None:
    cmd = "{} -i {} -o {} > {}".format(
        CDHIT_CMD, input_file, output_file, log_file)
    logging.debug("Executing CD-HIT ..")
    execute_command(cmd)


def _enough_blast_results(
        fasta_file: str, configuration: MsaConfiguration) -> bool:
    counter = 0
    for _, _ in _read_fasta_file(fasta_file):
        counter += 1
    logging.info("Number of sequences in %s is %s", fasta_file, counter)
    return counter > configuration.minimum_sequence_count


def _select_sequences(input_file: str, output_file: str, count: int):
    """
    Keep only first N of sequences.
    """
    sequences = _read_fasta_file(input_file)
    if 0 < count < len(sequences):
        logging.info("Using %s from %s sequences", count, len(sequences))
        sequences = sequences[0:count]
    # Write only selected.
    with open(output_file, "w") as out_stream:
        for (header, sequence) in sequences:
            out_stream.write(_format_fasta_sequence(header, sequence))


# endregion

def _compute_msa_for_sequences(
        fasta_file: str, sequence_file: str, output_file: str,
        working_dir: str) -> None:
    muscle_input = os.path.join(working_dir, "muscle-input")
    _merge_files([sequence_file, fasta_file], muscle_input)
    cmd = "cat {} | {} -quiet > {}".format(
        muscle_input, MUSCLE_CMD, output_file)
    logging.info("Executing muscle ...")
    execute_command(cmd)


def _merge_files(input_files: typing.List[str], output_file: str) -> None:
    with open(output_file, "w") as out_stream:
        for input_file in input_files:
            with open(input_file) as in_stream:
                for line in in_stream:
                    out_stream.write(line)


def _prepare_for_conservation(input_file: str, output_file: str) -> None:
    """
    Put the marked sequence at the top of the file and change it's header,
    and fix some issues.
    """
    logging.info("Ordering muscle results ...")
    first_header = None
    first_sequence = None
    for header, sequence in _read_fasta_file(input_file):
        if header.startswith(MARK_SEQUENCE_PREFIX):
            # We can remove the prefix here
            first_header = header[len(MARK_SEQUENCE_PREFIX):]
            first_sequence = sequence
            break

    if first_header is None:
        raise Exception("Missing header '" + MARK_SEQUENCE_PREFIX +
                        "' in " + input_file)
    with open(output_file, "w", newline="\n") as out_stream:
        out_stream.write(
            _format_fasta_sequence(first_header, first_sequence, 60))
        for header, sequence in _read_fasta_file(input_file):
            if header.startswith(MARK_SEQUENCE_PREFIX):
                continue
            out_stream.write(_format_fasta_sequence(header, sequence, 60))


# endregion

# region Alignment to conservation

def compute_jensen_shannon_divergence(
        input_file: str, output_file: str) -> str:
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
    execute_command(cmd)
    return output_file


def sanitize_jensen_shannon_divergence_input(
        input_file: str, output_file: str) -> None:
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

# endregion
