FAIL=false

for PKG in "crypto" "reloader" "utilities/siws"
do
    UNCOVERED_FUNCS=$(go tool cover -func=coverage.out | grep "^github.com/supabase/auth/internal/$PKG/" | grep -v '100.0%$')
    UNCOVERED_FUNCS_COUNT=$(echo "$UNCOVERED_FUNCS" | wc -l)

    if [ "$UNCOVERED_FUNCS_COUNT" -gt 1 ] # wc -l counts +1 line
    then
	echo "Package $PKG not covered 100% with tests. $UNCOVERED_FUNCS_COUNT functions need more tests. This is mandatory."
	echo "$UNCOVERED_FUNCS"
	FAIL=true
    fi
done

if [ "$FAIL" = "true" ]
then
    exit 1
else
    exit 0
fi
