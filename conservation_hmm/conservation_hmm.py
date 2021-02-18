#!/usr/bin/env python3

from sys import argv
from subprocess import DEVNULL, run


def generate_MSA(FASTA_file, database_file, working_directory):
    run('phmmer -o /dev/null -A {}{}.sto {} {}'.format(working_directory, FASTA_file, FASTA_file, database_file).split())


def calculate_sequence_weights(FASTA_file, working_directory):
    with open('{}{}.stow'.format(working_directory, FASTA_file), mode='w') as f:
        run('esl-weight {}{}.sto'.format(working_directory, FASTA_file).split(), stdout=f)


def calculate_information_content(FASTA_file, working_directory):
    run('esl-alistat --icinfo {}{}.ic --rinfo {}{}.r --weight {}{}.stow'.format(working_directory, FASTA_file, working_directory, FASTA_file, working_directory, FASTA_file).split(), stdout=DEVNULL)


def read_FASTA_file(FASTA_file):
    FASTA_file_sequence = ''
    with open(FASTA_file) as f:
        FASTA_file_header = next(f).rstrip()
        for line in f:
            FASTA_file_sequence += line.rstrip()
    return FASTA_file_header, FASTA_file_sequence


def read_information_content(FASTA_file, working_directory):
    try:
        with open('{}{}.ic'.format(working_directory, FASTA_file)) as fi:
            information_content = [i.strip().split()[3] for i in fi if (i[0] != '#') and (i[0] != '/') and (i.lstrip()[0] != '-')]
        with open('{}{}.r'.format(working_directory, FASTA_file)) as fi:
            freqgap = [i.strip().split()[5] for i in fi if (i[0] != '#') and (i[0] != '/') and (i.lstrip()[0] != '-')]
        return information_content, freqgap
    except FileNotFoundError:
        return None, None


def write_feature(target_file, FASTA_file_sequence, feature):
    with open(target_file, mode='w') as f:
        for (i, j), k in zip(enumerate(FASTA_file_sequence), feature):
            f.write('\t'.join((str(i), j, k)) + '\n')


def conservation_hmm(FASTA_file, database_file, working_directory, target_file):
    generate_MSA(FASTA_file, database_file, working_directory)
    calculate_sequence_weights(FASTA_file, working_directory)
    calculate_information_content(FASTA_file, working_directory)
    FASTA_file_header, FASTA_file_sequence = read_FASTA_file(FASTA_file)
    information_content, freqgap = read_information_content(FASTA_file, working_directory)
    if information_content:
        assert len(FASTA_file_sequence) == len(information_content) == len(freqgap)
        write_feature(target_file, FASTA_file_sequence, information_content)
        write_feature(target_file + '.freqgap', FASTA_file_sequence, freqgap)
    else:
        write_feature(target_file, FASTA_file_sequence, ('-1000.0' for i in FASTA_file_sequence))
        write_feature(target_file + '.freqgap', FASTA_file_sequence, ('-1000.0' for i in FASTA_file_sequence))


if __name__ == '__main__':
    conservation_hmm(*argv[1:])


