#!/usr/bin/env python3

from argparse import ArgumentParser
from subprocess import DEVNULL, run


def _generate_msa(fasta_file, database_file, working_directory):
    run(
        "phmmer -o /dev/null -A {}{}.sto {} {}".format(
            working_directory, fasta_file, fasta_file, database_file
        ).split()
    )


def _calculate_sequence_weights(fasta_file, working_directory):
    with open("{}{}.stow".format(working_directory, fasta_file), mode="w") as f:
        run(
            "esl-weight {}{}.sto".format(working_directory, fasta_file).split(),
            stdout=f,
        )


def _calculate_information_content(fasta_file, working_directory):
    run(
        "esl-alistat --icinfo {}{}.ic --rinfo {}{}.r --weight {}{}.stow".format(
            working_directory,
            fasta_file,
            working_directory,
            fasta_file,
            working_directory,
            fasta_file,
        ).split(),
        stdout=DEVNULL,
    )


def _read_fasta_file(fasta_file):
    fasta_file_sequence = ""
    with open(fasta_file) as f:
        fasta_file_header = next(f).rstrip()
        for line in f:
            fasta_file_sequence += line.rstrip()
    return fasta_file_header, fasta_file_sequence


def _read_information_content(fasta_file, working_directory):
    try:
        with open("{}{}.ic".format(working_directory, fasta_file)) as fi:
            information_content = [
                i.strip().split()[3]
                for i in fi
                if (i[0] != "#") and (i[0] != "/") and (i.lstrip()[0] != "-")
            ]
        with open("{}{}.r".format(working_directory, fasta_file)) as fi:
            freqgap = [
                i.strip().split()[5]
                for i in fi
                if (i[0] != "#") and (i[0] != "/") and (i.lstrip()[0] != "-")
            ]
        return information_content, freqgap
    except FileNotFoundError:
        return None, None


def _write_feature(target_file, fasta_file_sequence, feature):
    with open(target_file, mode="w") as f:
        for (i, j), k in zip(enumerate(fasta_file_sequence), feature):
            f.write("\t".join((str(i), k, j)) + "\n")


def conservation_hmm(
    fasta_file, database_file, working_directory, target_file, msa=False
):
    _generate_msa(fasta_file, database_file, working_directory)
    _calculate_sequence_weights(fasta_file, working_directory)
    _calculate_information_content(fasta_file, working_directory)
    fasta_file_header, fasta_file_sequence = _read_fasta_file(fasta_file)
    information_content, freqgap = _read_information_content(
        fasta_file, working_directory
    )
    if information_content:
        assert (
            len(fasta_file_sequence) == len(information_content) == len(freqgap)
        )
        _write_feature(target_file, fasta_file_sequence, information_content)
        _write_feature(target_file + ".freqgap", fasta_file_sequence, freqgap)
    else:
        _write_feature(
            target_file,
            fasta_file_sequence,
            ("-1000.0" for i in fasta_file_sequence),
        )
        _write_feature(
            target_file + ".freqgap",
            fasta_file_sequence,
            ("-1000.0" for i in fasta_file_sequence),
        )


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("fasta_file")
    parser.add_argument("database_file")
    parser.add_argument("working_directory")
    parser.add_argument("target_file")
    parser.add_argument("--msa", action="store_true")
    args = vars(parser.parse_args())
    if args["msa"]:
        print("Not yet implemented!")
    else:
        conservation_hmm(**args)
