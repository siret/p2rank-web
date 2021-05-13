#!/usr/bin/env python3

from argparse import ArgumentParser


def _mask_ic_file(ic_file, freqgap_file, target_file, max_freqgap, mask_string):
    with open(ic_file) as f_ic, open(freqgap_file) as f_freqgap, open(
        target_file, mode="w"
    ) as f_target:
        for line_ic, line_freqgap in zip(f_ic, f_freqgap):
            i, freqgap, aa = line_freqgap.split("\t")
            if float(freqgap) > max_freqgap:
                f_target.write("\t".join((i, mask_string, aa)))
            else:
                f_target.write(line_ic)


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("ic_file")
    parser.add_argument("freqgap_file")
    parser.add_argument("target_file")
    parser.add_argument("max_freqgap", type=float)
    parser.add_argument("mask_string")
    args = vars(parser.parse_args())
    _mask_ic_file(**args)
