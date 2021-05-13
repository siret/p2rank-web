#!/bin/bash

DATABASE_FILE="./database/uniprot_sprot.fasta"
WORKING_DIRECTORY="./working/"

for FASTA_FILE in *.fasta
do
	echo "Processing file:" ${FASTA_FILE}
	../conservation_hmm.py ${FASTA_FILE} ${DATABASE_FILE} ${WORKING_DIRECTORY} ${FASTA_FILE}.ic --max_seqs 1000
	./mask_ic_file.py ${FASTA_FILE}.ic ${FASTA_FILE}.ic.freqgap ${FASTA_FILE}.ic.masked 0.5 masked
done
