istanbul-baseline
=================

    npm install istanbul-baseline

[Istanbul](https://github.com/gotwarlost/istanbul) reports coverage for
all the files your test suit actually *loads*.  But what about the files
that are never loaded?  They're omitted completely.  This skews your
coverage stats, and may allow un-tested code to go completely un-noticed. 

`istanbul-baseline` can create a "zero-coverage" report for any set of 
files in your project.

    node_modules/.bin/istanbul-baseline **/*.js
    
Then just run your regular coverage/test run. For example:

    istanbul cover --report json --print none _mocha ./tests/
    
And the final report and coverage-check will include all files from the 
baseline *and* the main coverage run.  And check-coverage 

    istanbul report html text-summary
    istanbul check-coverage --lines 90
    

    