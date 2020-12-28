#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Prepare BLAST database with default files.
#

import blast_database


def main():
    databases = blast_database.DATABASE_NAME_TO_URL.values()
    blast_database.prepare_databases(databases)


if __name__ == "__main__":
    main()
