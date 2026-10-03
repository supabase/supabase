function func1(
  _target: any,
  _methodName: string,
  descriptor: PropertyDescriptor,
) {
  const orig = descriptor.value;

  descriptor.value = function (...args: any[]) {
    orig.call(this, ...args);
    return "meow?";
  };

  return descriptor;
}

class Class {
  @func1
  func2() {
    return "meow";
  }
}

Deno.serve(async (_req) => {
  const cls = new Class();
  return new Response(cls.func2());
});
