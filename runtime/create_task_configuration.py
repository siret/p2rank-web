#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Create configuration from task identification.
# 2SRC          -> 2SRC None
# 2SRC_A        -> 2SRC [A]
# 3UIT_A,B,C,D  -> 3UIT [A,B,C,D]
#

import argparse
import typing
import json


def _read_arguments() -> typing.Dict[str, str]:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--task", required=True, help="Task identification like 2SRC or 2SRC_A."
    )
    parser.add_argument("--conservation", action="store_true", help="Use conservation.")
    parser.add_argument("--output", required=True, help="Output file.")
    return vars(parser.parse_args())


def main(arguments):
    pdb, chains = parse_task_id(arguments["task"])
    result = {
        "structure": {"code": pdb, "file": None, "chains": chains},
        "conservation": {
            "compute": arguments["conservation"],
            "msaFile": None,
            "hsspCode": None,
        },
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
