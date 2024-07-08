{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = pkgs.lib;
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            deno
            self.formatter.${system}
          ];
        };

        packages.default =
          let
            scriptHash = "sha256-ol6VqcQSHtKBMbAg2174HoUrf221VQ9Em0Rf/50/3hg=";
            script = pkgs.stdenv.mkDerivation {
              name = "raco-cli.js";
              src = ./.;

              nativeBuildInputs = with pkgs; [ deno ];

              phases = [
                "unpackPhase"
                "buildPhase"
              ];

              buildPhase = ''
                export HOME=$(mktemp -d)
                deno bundle ./index.ts > $out
              '';

              outputHash = scriptHash;
              outputHashAlgo = "sha256";
              outputHashMode = "flat";
            };
            output = pkgs.writeShellScriptBin "raco-cli" ''
              exec ${pkgs.deno}/bin/deno run -A --no-remote ${script} "$@"
            '';
          in
          output;

        formatter = pkgs.nixfmt-rfc-style;
      }
    );
}
