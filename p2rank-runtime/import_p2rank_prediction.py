#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Import predictions computed by p2rank into p2rank online.
#

import os
import logging
import json
import multiprocessing
import argparse
import subprocess
import shutil
import typing

import requests


def _read_arguments() -> typing.Dict[str, str]:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True,
                        help="Input directory.")
    parser.add_argument("--output", required=True,
                        help="Output directory.")
    parser.add_argument("--conservation", required=False,
                        help="Directory with conservations..")
    parser.add_argument("--p2rankUtils", required=True,
                        help="p2rank utils executable")
    return vars(parser.parse_args())


def main(arguments):
    init_logging()
    convert(
        arguments["p2rankUtils"],
        1,
        arguments["input"],
        arguments["output"],
        arguments["conservation"],
        "2020-09-30T00:00:01",
        "id_noconser"
    )


def init_logging(level=logging.DEBUG):
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] - %(message)s",
        datefmt="%H:%M:%S")


def convert(
        protein_utils: str, threads: int,
        input_dir: str, output_dir: str, conservation_dir: str,
        time: str, template: str):
    if conservation_dir is None:
        conservation_files = []
    else:
        conservation_files = os.listdir(conservation_dir)
    logging.info("Collecting PDB files from: %s", input_dir)
    pdb_ids = collect_pdb_ids(input_dir)
    if threads < 2:
        logging.info("Converting files in single thread ...")
        for index, pdb_id in enumerate(pdb_ids):
            logging.info("%i/%i : %s", index, len(pdb_ids), pdb_id)
            convert_pdb_file({
                "pdb": pdb_id,
                "input": input_dir,
                "output": output_dir,
                "protein-utils": protein_utils,
                "time": time,
                "template": template,
                "conservation": search_conservation(
                    conservation_files, conservation_dir, pdb_id)
            })
        logging.info("Converted: %s", len(pdb_ids))
        logging.info("Converting files ... done")
        return
    pool = multiprocessing.Pool(threads)
    logging.info("Converting files in multiple threads (%i) ...", len(pdb_ids))
    tasks = [{
        "pdb": pdb_id,
        "input": input_dir,
        "output": output_dir,
        "protein-utils": protein_utils,
        "time": time,
        "template": template,
        "conservation": search_conservation(
            conservation_files, conservation_dir, pdb_id),
    } for pdb_id in pdb_ids]
    pool.map(convert_pdb_file, tasks)
    logging.info("Converted: %s", len(tasks))
    logging.info("Converting files ... done")


def collect_pdb_ids(input_dir: str):
    result = set()
    for file in os.listdir(input_dir):
        if not file.endswith("_predictions.csv"):
            continue
        result.add(file[:file.index(".")].lower())
    return sorted(list(result))


def search_conservation(
        conservation_files: typing.List[str], directory:str, pdb: str):
    result = {}
    pdb = pdb.lower()
    for file_name in conservation_files:
        if not file_name.lower().startswith(pdb):
            continue
        chain = file_name[4].upper()
        result[chain] = os.path.join(directory, file_name)
    return result


def convert_pdb_file(task):
    output_dir = os.path.join(task["output"], task["pdb"].upper())
    if os.path.exists(output_dir):
        return
    os.makedirs(output_dir, exist_ok=True)
    create_stdout(os.path.join(output_dir, "stdout"))
    create_status(os.path.join(output_dir, "status.json"), task)
    try:
        public_dir = os.path.join(output_dir, "public")
        os.makedirs(public_dir, exist_ok=True)
        structure_file = os.path.join(public_dir, "structure.pdb")
        download_structure(structure_file, task["pdb"])
        prepare_json_files(
            task["protein-utils"],
            structure_file,
            predictions_file(task["input"], task["pdb"]),
            residues_file(task["input"], task["pdb"]),
            public_dir,
            task["conservation"])
    except:
        logging.error("Can't convert: %s", task["pdb"])
        shutil.rmtree(output_dir)
        raise


def create_stdout(path: str):
    with open(path, "w", encoding="utf-8", newline="\n") as stream:
        stream.write("Generated from PDBe input.")


def create_status(path: str, task):
    with open(path, "w", encoding="utf-8", newline="\n") as stream:
        json.dump({
            "id": task["pdb"].upper(),
            "created": task["time"],
            "lastChange": task["time"],
            "status": "successful",
            "lastFinishedStep": 1,
            "stepCount": 1,
            "template": task["template"]
        }, stream)


def download_structure(path: str, pdb: str):
    if os.path.exists(path):
        return
    url = "https://files.rcsb.org/download/" + pdb + ".pdb"
    download(url, path)


def download(url: str, destination: str) -> None:
    logging.debug(f"Downloading '{url}' to '{destination}' ...")
    response = requests.get(url)
    with open(destination, "wb") as stream:
        stream.write(response.content)


def predictions_file(input_directory: str, pdb: str) -> str:
    path = os.path.join(input_directory, pdb + ".pdb.gz_predictions.csv")
    if os.path.exists(path):
        return path
    path = os.path.join(input_directory, pdb + ".pdb_predictions.csv")
    if os.path.exists(path):
        return path
    raise RuntimeError("Missing predictions file for: " + pdb)


def residues_file(input_directory: str, pdb: str) -> str:
    path = os.path.join(input_directory, pdb + ".pdb.gz_residues.csv")
    if os.path.exists(path):
        return path
    path = os.path.join(input_directory, pdb + ".pdb_residues.csv")
    if os.path.exists(path):
        return path
    raise RuntimeError("Missing residue file for: " + pdb)


def prepare_json_files(
        protein_utils: str,
        structure_file: str,
        predictions_file: str,
        residues_file: str,
        output_path: str,
        conservation_map: typing.Dict[str, str]):
    output_prediction_file = os.path.join(output_path, "prediction.json")
    output_sequence_file = os.path.join(output_path, "sequence.json")

    conservation_args = ""
    for chain, file in conservation_map.items():
        conservation_args += f" --conservation {chain}={file}"

    command = f"{protein_utils} -a p2rank-web" \
              f" --structure={structure_file}" \
              f" --prediction={predictions_file}" \
              f" --residues={residues_file}" \
              f" --output-pocket={output_prediction_file}" \
              f" --output-sequence={output_sequence_file}" \
              f" {conservation_args}"

    execute_command(command)


def execute_command(command: str):
    logging.debug("Executing '%s'", command)
    result = subprocess.run(command, shell=True, env=os.environ.copy())
    # Throw for non-zero (failure) return code.
    result.check_returncode()


if __name__ == "__main__":
    main(_read_arguments())
