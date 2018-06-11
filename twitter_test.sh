#/bin/bash

function WriteGnuplotFile() {
	if [[ "${1}" == "" ]]
	then
		(>&2 echo "No output file set for gnuplot script!")
		exit -1
	fi

	echo "#"
	echo "# Usage: gnuplot ${1}"
	echo "#"
	echo "set term postscript enhanced eps color"
	echo "set key out bottom center maxrows 3 samplen 1.5"
	echo "set xlabel 'Time (GMT)'"
	echo "set xtics rotate by -45"
	echo "set ylabel 'Frequency / Hz'"
	echo "set output '${1}'"
	echo "plot for [col=5:*] 'output.timeseries' u 0:(column(col)/\$3):xtic(2) w lp lw 5 pt 7 ps 1.5 t columnhead(col-1)"
}

#
# Check we have something to search for
#
if [[ ${#} -lt 1 ]];
then
	echo ""
	echo "Usage: ${0} word1 [word2 ...]"
	echo ""
	exit
fi

#
# Check for sensitive data export file - DON'T INCLUDE CREDENTALS IN ANY FILE
# THAT IS TRACKED BY ANY PUBLIC VERSION CONTROL, e.g. GIT!
#
if [[ ! -f "sensitive.sh" ]]
then
	echo "Can't find sensitive.sh for sensitive exports into environment variables!"
	exit -1
fi

#
# Perform sensitive variable exports into current shell's environment; these should
# hopefully disappear when this current shell exits!
#
. ./sensitive.sh

#
# Some default variables
#
update_interval_s="2"
output_file="output.timeseries"

#
# Write gnuplot script file
#
WriteGnuplotFile "${output_file}.eps" > "plot_output.gscr"

#
# Start watching the streaming data from Twitter; quotes around params variable
# required if we've passed in multi-word strings delineated by quotes on the
# command line.
#
node twitter.js ${update_interval_s} "${@}" | tee ${output_file}
