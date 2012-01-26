#!/usr/bin/env python

import sys
from random import shuffle, sample, randint, choice
from string import join
from datetime import datetime

CHANNELS=['room1', 'ops', 'war3z']
NICKS=['john', 'foo', 'user2', 'admin', 'logbot', 'randomguy']
WORDS=[line.strip() for line in open('/usr/share/dict/words')]

FILENAME="logs/%s-%04d-%02d-%02d.txt"
FORMAT="%s: %s\n"
FORMAT_MSG="<%s> %s"
FORMAT_JOIN="%s joined."
FORMAT_PART="%s left (%s)."
FORMAT_TIME="%H:%M:%S GMT-0500 (EST)"

YEAR=2012
MONTH=1
DAYS=18
LINES=20

def run():
    for day in range(1, DAYS+1):
        for channel in CHANNELS:
            filename = FILENAME % (channel, YEAR, MONTH, day)
            with open(filename, 'w') as f:
                for n in range(LINES):
                    f.write(getline())

def random_sentance(nick):
    line = sample(WORDS, randint(2, 20))
    shuffle(line)
    return FORMAT_MSG % (nick, join(line))

def getline():
    nick = choice(NICKS)
    line = {
        0: random_sentance,
        1: lambda n: FORMAT_JOIN % (n),
        2: random_sentance,
        3: lambda n: FORMAT_PART % (n, "client exited"),
        4: random_sentance,
    }[randint(0,4)](nick)
    return FORMAT % (datetime.now().strftime(FORMAT_TIME), line)

if __name__=="__main__":
    EXPECTED_ARGS=0
    if len(sys.argv) == EXPECTED_ARGS + 1:
        run()
    else:
        print "Usage: $0"

