# conservation\_hmm

## About

`conservation_hmm.py` is a Python script which can be used to calculate per-position information content (IC) values for amino acid residues in a FASTA file. It is inspired by the [INTAA-conservation](https://github.com/davidjakubec/INTAA-conservation) pipeline utilized by the [Amino Acid Interactions (INTAA) web server](https://bioinfo.uochb.cas.cz/INTAA/). Unlike INTAA-conservation, `conservation_hmm.py` skips parsing the PDB structure and works with the single-sequence FASTA files directly. For further information on the pipeline's logic, please refer to the [INTAA manual](https://ip-78-128-251-188.flt.cloud.muni.cz/energy/doc/manual2.html#Calculation_of_information_content).

## Installation

`conservation_hmm.py` is a transferable, executable script which does not require any installation. It does not depend on any other Python packages or files. For other dependencies, please see the section below.

### Requirements

The [HMMER](http://hmmer.org/) software package, including the Easel tools, must be installed and the programs must be available in `$PATH`. All development and testing is done using HMMER 3.3.2.

The script `examples/database/download_Swiss-Prot.sh` can be used to download an example sequence database.

## Usage

Use
```
conservation_hmm.py FASTA_file database_file working_directory target_file
```
where `FASTA_file`, `database_file`, `working_directory`, and `target_file` are required **positional** arguments with the following specifications:
 - `FASTA_file` is the input sequence in FASTA format. The first line **is assumed** to be the header; the following line or lines are expected to contain the sequence. Only a single header/sequence per file is assumed.
 - `database_file` is a sequence database used to construct the multiple sequence alignments (MSAs) based on which the IC is later calculated. It is usually a regular file in a multiple-sequence FASTA format.
 - `working_directory` is a directory in which the MSAs and other temporary files are stored. **It must end with your OS's path delimiting character** \[*i.e.*, a slash \("/"\) on UNIX systems\] **in the script's arguments.** The temporary files in `working_directory` are **not** cleaned up after the script terminates.
 - `target_file` is the primary output file containing the per-position IC values. For its format and additional information, please see the section below.

The script `examples/run_examples.sh` presents an example use case. It can be used to calculate the per-position IC values for the `*.fasta` files present in the `examples/` directory, provided that the sequence database `examples/database/uniprot_sprot.fasta` and the directory `examples/working/` exist. **The contents of the `examples/` directory are not required for running the `conservation_hmm.py` script and serve only as a convenient way of showcasing and testing its usage.**

### Output

When the script terminates, the `target_file` will contain a list of tab-separated triples \(index, IC, amino\_acid\_residue\) for the amino acid residues in the `FASTA_file`, where index is simply a number starting from zero \(0\) for the first residue. One triple is provided per line.

In addition, a `target_file.freqgap` file will be produced, utilizing the same formatting as `target_file`, but containing the frequencies of the gap \(-\) character in the respective MSA columns instead of the per-position IC values.

If no MSA can be generated for the input `FASTA_file` \(*e.g.*, when it contains a synthetic sequence\), HMMER tools will print a message to the standard error stream, and `target_file` and `target_file.freqgap` will contain the value of -1000.0 for their respective per-residue properties.
