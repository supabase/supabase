# Matches orioledb/ci/cmds.gdb (OrioleDB's own CI crash-debugging script).
# debug-file-directory/file/core-file are set by the caller before this
# file is sourced (see process-orioledb-coredumps.sh).
#
# GDB aborts the rest of a sourced script on the first command error, so
# order matters here: the reliable, high-value output runs first; the
# OrioleDB-internal lock-state dumps run last, since they can fail if
# orioledb.so's own debug symbols aren't available (a known, separate issue)
thread apply all bt full
up 99999
set $i=0
set $end=argc
while ($i < $end)
p argv[$i++]
end
info sharedlibrary
info registers
eval "p *((LWLockHandle (*) [%u]) held_lwlocks)", num_held_lwlocks
eval "p *((MyLockedPage (*) [%u]) myLockedPages)", numberOfMyLockedPages
quit
