import os
import pathlib
import shutil
import uuid
import yaml

BASEDIR = pathlib.Path(os.path.realpath(__file__)).parent
CONFIGSDIR = BASEDIR / "configs"
FIXTURES = yaml.load(
    (BASEDIR / "fixtures/fixtures.yaml").read_text(), Loader=yaml.Loader
)
NGINX_BIN = shutil.which("nginx")
POSTGREST_BIN = shutil.which("postgrest")
SECRET = "reallyreallyreallyreallyverysafe"


def hpctixfile():
    """
    Returns a unique filename for each postgrest process that is
    run, if the HPCTIXFILE environment variable is set.

    Later, we combine these files using "hpc sum" to get the
    complete coverage.
    """

    if "HPCTIXFILE" not in os.environ:
        return ""

    tixfile = pathlib.Path(os.environ["HPCTIXFILE"])
    # 12 chars are unique enough and chances of collisions are
    # astronomically low.
    test = uuid.uuid4().hex[:12]
    return tixfile.with_suffix(f".{test}.tix")


def get_admin_host_and_port_from_config(config):
    admin_host = config.get("PGRST_ADMIN_SERVER_HOST", config["PGRST_SERVER_HOST"])
    admin_port = config["PGRST_ADMIN_SERVER_PORT"]
    return (admin_host, admin_port)
