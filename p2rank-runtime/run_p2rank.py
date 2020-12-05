#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# Run p2rank without the task, designed to be used as a docker command
# to allow p2rank execution inside the docker.
#

import os
import argparse
import typing
import shutil

import conservation
import run_p2rank_task as p2rank_task

PROTEIN_UTILS_CMD = os.environ["PROTEIN_UTILS_CMD"]

HSSP_DATABASE_DIR = os.environ["HSSPTDB"]


def _read_arguments() -> typing.Dict[str, str]:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdb", required=False,
                        help="PDB code.")
    parser.add_argument("--pdb-file", required=False,
                        help="PDB file.")
    parser.add_argument("--input", default="./",
                        help="Input directory.")
    parser.add_argument("--output", default="./",
                        help="Output directory.")
    parser.add_argument("--conservation", action="store_true",
                        help="Use conservation.")
    parser.add_argument("--p2rank", default="/opt/p2rank/default",
                        help="p2rank directory with run_p2rank.sh file.")
    return vars(parser.parse_args())


def main(arguments):
    arguments["working"] = os.path.join(arguments["output"], "working")
    #
    p2rank_task.init_logging()
    conservation.execute_command = p2rank_task.execute_command
    p2rank_task.prepare_directories(arguments)
    configuration = {
        "structure": {
            "code": arguments.get("pdb", None),
            "file": arguments.get("pdb_file", None),
            "chains": None
        },
        "conservation": {
            "compute": arguments["conservation"],
            # We do not support those options.
            "msaFile": None,
            "hsspCode": None,
        }
    }

    structure = p2rank_task.prepare_structure(arguments, configuration)
    conservation_files = p2rank_task.prepare_conservation(
        configuration, arguments, structure)

    p2rank_output = p2rank_task.execute_p2rank(
        arguments, structure.file, configuration, conservation_files)
    p2rank_task.collect_download_data(
        p2rank_output, structure, conservation_files, arguments["output"])

    shutil.rmtree(arguments["working"])


if __name__ == "__main__":
    main(_read_arguments())
