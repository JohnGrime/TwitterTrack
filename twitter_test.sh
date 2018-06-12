#/bin/bash

#
# Paths to some files we'll be using.
#
sensitive_keys="twitter_access_keys.sh"
output_file="output.timeseries"

#
# Some default variables
#
update_interval_s="2"

#
# Write gnuplot script file, for simple plotting of the output.
#
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
	echo "Usage: ${0} phrase1 [phrase2 ...]"
	echo ""
	echo "Notes:"
	echo "  - Multi-word phrases should be \"enclosed in double quotes\""
	echo ""
	exit
fi

#
# Check for Twitter access key export file - DON'T INCLUDE THESE CREDENTALS
# IN ANY FILE THAT IS PUBLICALLY ACCESSIBLE, e.g. tracked by Git for a public
# repository!
#
if [[ ! -f "${sensitive_keys}" ]]
then
	echo "Can't find file ${sensitive_keys} to export Twitter access keys into current environment variables!"
	exit -1
fi

#
# Perform sensitive variable exports into current shell's environment; these should
# hopefully disappear again when this current shell exits.
#
. ./${sensitive_keys}

#
# Write gnuplot script file. If you have gnuplot installed, you can plot the data with:
#
# gnuplot plot_output.gscr
#
WriteGnuplotFile "${output_file}.eps" > "plot_output.gscr"

#
# Start watching the streaming data from Twitter; quotes around params variable
# required if we've passed in multi-word strings delineated by quotes on the
# command line.
#
node twitter_track.js ${update_interval_s} "${@}" | tee ${output_file}
