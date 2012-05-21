#!/bin/bash

set -e

HERE=$(cd "${0%/*}" 2>/dev/null; echo "$PWD")
cd $HERE

NAME=savory-1.0beta1-0.noarch
OUTPUT=BUILDROOT/$NAME

# Content
rm -rf $OUTPUT
mkdir -p $OUTPUT/usr/lib/savory/
mkdir -p $OUTPUT/usr/share/applications/
cp -r ../distribution/content/* $OUTPUT/usr/lib/savory/
cp ../../components/media/savory.png $OUTPUT/usr/lib/savory/
cp savory.desktop $OUTPUT/usr/share/applications/

rpmbuild --define "_topdir $HERE" --target noarch -bb --sign SPECS/savory.spec

# Cleanup
rm -rf $OUTPUT
mv RPMS/noarch/$NAME.rpm ../distribution/savory-1.0-beta1.rpm

echo Done!
