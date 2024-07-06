# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.1.18 as base
WORKDIR /usr/src/app

# install with --production (exclude devDependencies)
FROM base AS build
RUN mkdir -p /temp/prod
COPY . /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production && bun run build

# copy production build to release image
FROM base AS release
COPY --from=build /temp/prod/dist/grolf .
COPY --from=build /temp/prod/package.json .
COPY --from=build /temp/prod/lib/templates.yaml ./lib/templates.yaml
RUN chown -R bun:bun .
RUN mkdir db && chown -R bun:bun db

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "./grolf" ]
