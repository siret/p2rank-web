#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Prepare BLAST database with default files.
#

import os
import subprocess
import blast_database


def main():
    databases = blast_database.DATABASE_NAME_TO_URL.keys()
    blast_database.prepare_databases(execute_command, databases)


def execute_command(command: str):
    result = subprocess.run(command, shell=True, env=os.environ.copy())
    # Throw for non-zero (failure) return code.
    result.check_returncode()


if __name__ == "__main__":
    main()
