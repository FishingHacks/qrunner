export default `#!/bin/bash
# Credit: https://github.com/johnlindquist/kit/blob/main/root/kar

args="["
first=true
for var in "\${@:2}"
do
  if [ $first = true ]
  then
    first=false
  else
    args+=","
  fi
  args+='"'$var'"'
done
args+="]"

json="{\"script\":\"$1\",\"args\":$args}"
echo $json
curl --data "$json" --header "Content-Type: application/json" localhost:1205`;