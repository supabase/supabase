export function sanitizeEnumNames(introspection: any) {
    if (!introspection?.data?.__schema?.types) return introspection;
  
    introspection.data.__schema.types = introspection.data.__schema.types.map((t: any) => {
      if (t.kind === 'ENUM' && Array.isArray(t.enumValues)) {
        t.enumValues = t.enumValues.map((v: any) => ({
          ...v,
          name: v.name.replace(/[^_A-Za-z0-9]/g, '_'),
        }));
      }
      return t;
    });
  
    return introspection;
  }