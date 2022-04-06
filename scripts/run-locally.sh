#! /bin/bash

set -eo pipefail

cd "$(dirname "$0")/.."

trap 'trap - SIGTERM && pkill -P $$' SIGINT SIGTERM EXIT

solana-test-validator &

anchor build
solana program deploy /Users/kyle/proj/realitycoin_consensus/target/deploy/realitycoin_consensus.so

sleep 99999999