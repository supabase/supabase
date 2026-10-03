# Creates an environment that exposes bash-completion arguments from all checkedShellScripts
{ buildEnv }:
{
  name,
  tools,
  extra ? { },
}:
let
  bash-completion = map (tool: (builtins.getAttr tool tools).bash-completion) (
    builtins.attrNames tools
  );

  env = buildEnv {
    inherit name;
    paths = map (tool: (builtins.getAttr tool tools).bin) (builtins.attrNames tools);
  };

in
env // tools // { inherit bash-completion; } // extra
