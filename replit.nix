{pkgs}: {
  deps = [
    pkgs.xsimd
    pkgs.pkg-config
    pkgs.libxcrypt
    pkgs.espeak-ng
    pkgs.portaudio
    pkgs.postgresql
    pkgs.openssl
  ];
}
