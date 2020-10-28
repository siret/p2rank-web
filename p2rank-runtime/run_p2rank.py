#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Run p2rank without the task, designed to be used as a docker command
# to allow p2rank execution inside the docker.
#

import os
import argparse
import typing

import conservation
import run_p2rank_task as p2rank

PROTEIN_UTILS_CMD = os.environ["PROTEIN_UTILS_CMD"]

HSSP_DATABASE_DIR = os.environ["HSSPTDB"]


def _read_arguments() -> typing.Dict[str, str]:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdb", required=False,
                        help="PDB code.")
    parser.add_argument("--pdb-file", required=False,
                        help="PDB file.")
    parser.add_argument("--input", required=False,
                        default="/tmp/p2rank-input",
                        help="Input directory.")
    parser.add_argument("--output", required=False,
                        default="/tmp/p2rank-output",
                        help="Output directory.")
    parser.add_argument("--conservation", action="store_true",
                        help="Use conservation.")
    parser.add_argument("--p2rank", required=True,
                        default=os.environ["DEFAULT_P2RANK"],
                        help="p2rank directory.")
    return vars(parser.parse_args())


def main(arguments):
    arguments["working"] = os.path.join(arguments["output"], "working")
    #
    p2rank.init_logging()
    conservation.execute_command = p2rank.execute_command
    p2rank.prepare_directories(arguments)
    configuration = {
        "structure": {
            "code": arguments["pdb"],
            "file": arguments["pdb-file"],
            "chains": None
        },
        "conservation": {
            "compute": arguments["conservation"],
            # We do not support those options.
            "msaFile": None,
            "hsspCode": None,
        }
    }
    full_structure_file, structure_file, chains = \
        p2rank.prepare_structure(arguments, configuration)
    conservation_files = p2rank.prepare_conservation(
        structure_file, chains, configuration, arguments)

    print("Configuration:", configuration)
    print("Structure    :", structure_file)
    print("Conservation :", conservation_files)

    p2rank_output = p2rank.execute_p2rank(
        arguments, structure_file, configuration, conservation_files)

    p2rank.process_p2rank_output(
        full_structure_file, p2rank_output, arguments["output"],
        conservation_files)


if __name__ == "__main__":
    main(_read_arguments())