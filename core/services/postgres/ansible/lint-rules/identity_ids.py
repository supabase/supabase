from ansiblelint.file_utils import Lintable
from ansiblelint.rules import AnsibleLintRule
from ansiblelint.utils import Task


class ExplicitIdentityIDRule(AnsibleLintRule):
    id = "explicit-identity-id"
    shortdesc = "Users and groups must specify numeric IDs"
    description = "ansible.builtin.user must specify uid and ansible.builtin.group must specify gid."
    severity = "HIGH"
    tags = ["idempotency"]
    version_changed = "1.0.0"

    def matchtask(
        self,
        task: Task,
        file: Lintable | None = None,
    ) -> bool | str:
        action = task["action"]
        module = action["__ansible_module__"].rsplit(".", 1)[-1]

        if action.get("state", "present") == "absent":
            return False

        if module == "user" and "uid" not in action:
            return "ansible.builtin.user must specify uid"

        if module == "group" and "gid" not in action:
            return "ansible.builtin.group must specify gid"

        return False
