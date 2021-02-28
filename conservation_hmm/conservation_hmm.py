#!/usr/bin/env python3

import typing
import argparse
import subprocess
import os


def _read_arguments() -> typing.Dict[str, str]:
    parser = argparse.ArgumentParser(
        description="Compute conservation scores for given sequences"
                    "using HMM.")
    parser.add_argument(
        "--fasta_file", required=True,
        help="Input FASTA file with header on the first line.")
    parser.add_argument(
        "--database_file", required=True,
        help="Path to a sequence database used to construct the multiple"
             "sequence alignments (MSAs) based on which the IC is later "
             "calculated. It is usually a regular file in a multiple-sequence "
             "FASTA format")
    parser.add_argument(
        "--working_directory", required=True,
        help="Is a directory in which the MSAs and other temporary "
             "files are stored.")
    parser.add_argument(
        "--target_file", required=True,
        help="The primary output file containing the per-position IC.")

    return vars(parser.parse_args())


def main(arguments):
    compute_conservation(
        arguments["fasta_file"],
        arguments["database_file"],
        _sanitize_working_directory(arguments["working_directory"]),
        arguments["target_file"],
        _default_execute_command
    )


def _default_execute_command(command: str, stdout=None):
    result = subprocess.run(
        command, shell=True, env=os.environ.copy(), stdout=stdout)
    # Throw for non-zero (failure) return code.
    result.check_returncode()


def _sanitize_working_directory(path: str) -> str:
    return path if path.endswith(os.path.sep) else path + os.path.sep


def compute_conservation(
        fasta_file: str, database_file: str,
        working_directory: str, target_file: str,
        execute_command: typing.Callable[[str], None]):
    mas_file = _generate_msa(
        fasta_file, database_file, working_directory, execute_command)
    weighted_mas_file = _calculate_sequence_weights(
        fasta_file, working_directory, mas_file, execute_command)
    ic_file, r_file = _calculate_information_content(
        fasta_file, working_directory, weighted_mas_file, execute_command)
    #
    fasta_header, fasta_sequence = _read_fasta_file(fasta_file)
    try:
        information_content, freqgap = _read_information_content(
            ic_file, r_file)
    except FileNotFoundError:
        information_content = freqgap = ["-1000.0"] * len(fasta_sequence)

    assert (len(fasta_sequence) == len(information_content) == len(freqgap))

    _write_feature(target_file, fasta_sequence, information_content)
    _write_feature(target_file + ".freqgap", fasta_sequence, freqgap)


def _generate_msa(
        fasta_file: str, database_file: str, working_directory: str,
        execute_command) -> str:
    output_file = os.path.join(working_directory, fasta_file) + ".sto"
    command = ["phmmer", "-o", "/dev/null", "-A",
               output_file, fasta_file, database_file]
    execute_command(" ".join(command))
    return output_file


def _calculate_sequence_weights(
        fasta_file: str, working_directory: str, mas_file: str,
        execute_command) -> str:
    output_file = os.path.join(working_directory, fasta_file) + ".stow"
    with open(output_file, "w") as stream:
        command = ["esl-weight", mas_file]
        execute_command(command, stdout=stream)
    return output_file


def _calculate_information_content(
        fasta_file: str, working_directory: str, weighted_mas_file: str,
        execute_command) -> typing.Tuple[str, str]:
    ic_file = os.path.join(working_directory, fasta_file) + ".sto"
    r_file = os.path.join(working_directory, fasta_file) + ".r"
    command = ["esl-alistat",
               "--icinfo", ic_file,
               "--rinfo", r_file,
               "--weight", weighted_mas_file]
    execute_command(command, stdout=subprocess.DEVNULL)
    return ic_file, r_file


def _read_fasta_file(fasta_file: str) -> typing.Tuple[str, str]:
    sequence = ""
    with open(fasta_file) as stream:
        header = next(stream).rstrip()
        for line in stream:
            sequence += line.rstrip()
    return header, sequence


def _read_information_content(
        ic_file: str, r_file: str
) -> typing.Tuple[typing.List[str], typing.List[str]]:
    with open(ic_file) as stream:
        information_content = [
            line.strip().split()[3]
            for line in stream if not _should_skip_line(line)
        ]

    with open(r_file) as stream:
        freqgap = [
            line.strip().split()[5]
            for line in stream if not _should_skip_line(line)
        ]

    return information_content, freqgap


def _should_skip_line(line: str) -> bool:
    return line[0] == "#" or line[0] == "/" or line.lstrip()[0] == "-"


def _write_feature(target_file, fasta_file_sequence, feature):
    with open(target_file, mode="w") as stream:
        for (index, aa_code), aa_code in \
                zip(enumerate(fasta_file_sequence), feature):
            stream.write("\t".join((str(index), aa_code, aa_code)) + "\n")


if __name__ == "__main__":
    main(_read_arguments())
