#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Create configuration from user provided configuration file.
#

import argparse
import typing
import json


def _read_arguments() -> typing.Dict[str, str]:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input file.")
    parser.add_argument("--output", required=True, help="Output file.")
    return vars(parser.parse_args())


def main(arguments):
    with open(arguments["input"], "r", encoding="utf-8") as stream:
        user_configuration = json.load(stream)

    result = {
        "structure": {
            "code": None,
            "file": "structure.pdb",
            "chains": user_configuration.get("chains", [])
        },
        "conservation": {
            "compute": user_configuration.get("conservation", False),
            "msaFile": None,
            "hsspCode": user_configuration.get("hssp", None)
        }
    }

    with open(arguments["output"], "w", encoding="utf-8") as stream:
        json.dump(result, stream)


def parse_task_id(task):
    tokens = task.split("_", maxsplit=2)
    pdb = tokens[0]
    if len(tokens) > 1:
        return pdb, tokens[1].split(",")
    else:
        return pdb, None


if __name__ == "__main__":
    main(_read_arguments())
