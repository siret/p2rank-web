#!/bin/bash

if [ -f uniprot_sprot.fasta ]
then
	rm uniprot_sprot.fasta
fi

wget https://ftp.expasy.org/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.fasta.gz
gunzip uniprot_sprot.fasta.gz
