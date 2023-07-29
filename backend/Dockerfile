# Build RyzenAdj: https://github.com/FlyGoat/RyzenAdj
FROM ghcr.io/steamdeckhomebrew/holo-base:latest AS ryzenadj

# Install dependencies
RUN pacman -Sy --noconfirm \
	base-devel \
	cmake \
	git \
	pciutils

# Build RyzenAdj binary
RUN pwd \
	&& git clone https://github.com/FlyGoat/RyzenAdj.git \
	&& mkdir /RyzenAdj/build \
	&& cd RyzenAdj/build \
	&& cmake -DCMAKE_BUILD_TYPE=Release .. \
	&& make

# It seems backend builds are expected to copy their outputs to a volume-mounted /backend/out.
# Since we can't copy the files directly there (volume mounts sometimes mask existing files),
# we'll collate the built files together in to a clean staging environment.
# The entrypoint will copy the built files in to the final destination.
# This could use virtually any image, but may as well use the same one as we already have it cached.
FROM ghcr.io/steamdeckhomebrew/holo-base:latest

COPY --from=ryzenadj /RyzenAdj/build/ryzenadj /stage/ryzenadj
COPY --from=ryzenadj /RyzenAdj/LICENSE /stage/ryzenadj-LICENSE

ENTRYPOINT [ "/backend/entrypoint.sh" ]
