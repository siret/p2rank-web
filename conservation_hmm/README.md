# conservation_hmm
`conservation_hmm.py` is a Python script which can be used to calculate 
per-position information content (IC) values for amino acid residues in 
a FASTA file. It is inspired by the 
[INTAA-conservation](https://github.com/davidjakubec/INTAA-conservation) 
pipeline utilized by the 
[Amino Acid Interactions (INTAA) web server](https://bioinfo.uochb.cas.cz/INTAA/).
 Unlike INTAA-conservation, `conservation_hmm.py` skips parsing the PDB 
 structure and works with the single-sequence FASTA files directly.
 For further information on the pipeline's logic, please refer to the 
 [INTAA manual](https://ip-78-128-251-188.flt.cloud.muni.cz/energy/doc/manual2.html#Calculation_of_information_content).

## Installation
In order to be able to run the `conservation_hmm.py` script you need:
 * Python 3.8 or higher.
 * The [HMMER](http://hmmer.org/) software package, including the Easel tools.
   The programs must be available in `$PATH`. All development and testing is
   done using HMMER 3.3.2.
 * Seqence database as a FASTA file.
   You can use following commands to download the example sequence database:
   ```
   wget https://ftp.expasy.org/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.fasta.gz
   gunzip uniprot_sprot.fasta.gz
   ```

## Usage
In this section we showcase application of the script on the 2SRC sequence.
First please make sure all the requirements specified in Installation
section are met. All commands bellow assume that you are in his directory.

First we need a sequence as a FASTA file. We can use 2SRC.
```
wget https://www.rcsb.org/fasta/entry/2SRC -o 2SRC.fasta
```
If the database is located in the ```./database/uniprot_sprot.fasta``` file, 
then we can use the following command to run the script:
```
python3 conservation_hmm.py --fasta_file 2SRC.fasta --database_file ./database/uniprot_sprot.fasta --working_directory ./working/ --target_file ./output.ic
```

When the script terminates, the `target_file` (```output.ic```) will contain a
list of tab-separated triples \(index, IC, amino\_acid\_residue\) for the 
amino acid residues in the `FASTA_file`, where index is simply a number starting 
from zero \(0\) for the first residue. One triple is provided per line.

In addition, a `target_file.freqgap` file will be produced, utilizing the same
formatting as `target_file`, but containing the frequencies of the gap \(-\)
character in the respective MSA columns instead of the per-position IC values.

If no MSA can be generated for the input `FASTA_file` \(*e.g.*, when it
contains a synthetic sequence\), HMMER tools will print a message to the
standard error stream, and `target_file` and `target_file.freqgap` will contain
the value of -1000.0 for their respective per-residue properties.

For more information about the arguments please run 
```python3 conservation_hmm.py -h```.

