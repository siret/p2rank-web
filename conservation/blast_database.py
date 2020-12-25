#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Manage available Blast databases.
#

import os
import typing
import logging

BLASTDMAKEDB_CMD = os.environ.get("BLASTDMAKEDB_CMD", None)

BLASTDB = os.environ.get("BLASTDB", None)

# Comma separated list of databases to used.
BLASTDB_USED = os.environ.get("BLASTDB_USED", None)

# For selected databases we store download URL.
DATABASE_NAME_TO_URL = {
    "swissprot":
        "https://p2rank.cz/www/conservation/current/uniprot_sprot.fasta.gz",
    "uniref50":
        "https://p2rank.cz/www/conservation/current/uniref50.fasta.gz",
    "uniref90":
        "https://p2rank.cz/www/conservation/current/uniref90.fasta.gz"
}

DATABASE_FILE_EXTENSIONS = [".phr", ".pin", ".pog", ".psd", ".psi", ".psq"]


def get_databases_to_use() -> typing.List[str]:
    """Return name of databases to use."""
    if BLASTDB_USED is None:
        return get_available_databases()
    return BLASTDB_USED.split(",")


def get_available_databases() -> typing.List[str]:
    """Return names of all available databases."""
    result = []
    for file_name in os.listdir(BLASTDB):
        if not file_name.endswith(".psi"):
            continue
        path = os.path.join(BLASTDB, file_name)
        if not os.path.isfile(path):
            continue
        name = file_name[:-4]
        # Name can be file.00, so we remove the number.
        if name[-3] == ".":
            name = name[:-3]
        if is_database_available(name):
            result.append(name)
    return result


def is_database_available(name: str) -> bool:
    """
    Basic check for available files, does not recognize if some files
    are missing.
    """
    base_name = os.path.join(BLASTDB, name)
    # It may be from multiple files, so check for the first one.
    return are_database_files_available(base_name) or \
           are_database_files_available(base_name + ".00")


def are_database_files_available(base_name: str) -> bool:
    for extension in DATABASE_FILE_EXTENSIONS:
        file = base_name + extension
        if not os.path.exists(file):
            return False
    return True


def prepare_databases(
        execute_command: typing.Callable[[str], None],
        names: typing.List[str]):
    for name in names:
        if is_database_available(name):
            continue
        prepare_database(execute_command, name)


def prepare_database(execute_command: typing.Callable[[str], None], name: str):
    if BLASTDMAKEDB_CMD is None:
        raise RuntimeError(
            "Can't create database as environment variable "
            "BLASTDMAKEDB_CMD is not set.")
    #
    logging.info("Preparing database: %s ...", name)
    url = DATABASE_NAME_TO_URL[name]
    command = "curl " + url + " | gunzip | " \
              + BLASTDMAKEDB_CMD \
              + " -out " + name + " -dbtype prot -parse_seqids"
    execute_command(command)
    logging.info("Preparing database: %s ... done", name)
