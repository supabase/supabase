function func1(fn: any, _ctx: ClassMethodDecoratorContext) {
  return function (...args: unknown[]) {
    fn(...args);
    return "meow?";
  };
}

class Class {
  @func1
  static func2() {
    return "meow";
  }
}

Deno.serve(async (_req) => {
  return new Response(Class.func2());
});
