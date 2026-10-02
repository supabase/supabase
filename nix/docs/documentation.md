# Documentation

We are using markdown for documentation in the `nix/docs` directory, which is rendered by [mkdocs](https://www.mkdocs.org/).

## Usage

To generate the documentation locally, you can use the following command in a development shell:

```bash
serve-nix-doc
```

This will start a local server at `http://localhost:8000` where you can view the documentation.
The documentation is automatically updated as you make changes to the markdown files.

## Configuration

Mkdocs configuration is done in the `nix/mkdocs.yml` file. Refer to the [Mkdocs documentation](https://www.mkdocs.org/user-guide/configuration/) for details on how to configure the site.
