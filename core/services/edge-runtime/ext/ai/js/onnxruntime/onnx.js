const core = globalThis.Deno.core;

const DataTypeMap = Object.freeze({
  float32: Float32Array,
  float64: Float64Array,
  string: Array.from, // string[]
  int8: Int8Array,
  uint8: Uint8Array,
  int16: Int16Array,
  uint16: Uint16Array,
  int32: Int32Array,
  uint32: Uint32Array,
  int64: BigInt64Array,
  uint64: BigUint64Array,
  bool: Uint8Array,
});

class TensorProxy {
  get(target, property) {
    switch (property) {
      case "data":
        return target.data?.c ?? target.data;

      default:
        return target[property];
    }
  }

  static fromTensor(tensor) {
    return new Proxy(tensor, new TensorProxy());
  }
}

class Tensor {
  /** @type {DataType} Type of the tensor. */
  type;

  /** @type {{ty: DataType, c: DataArray}} The data stored in the tensor. */
  data;

  /** @type {number[]} Dimensions of the tensor. */
  dims;

  /** @type {number} The number of elements in the tensor. */
  size = 0;

  constructor(type, data, dims) {
    if (!Object.hasOwn(DataTypeMap, type)) {
      throw new Error(`Unsupported type: ${type}`);
    }

    const dataType = DataTypeMap[type];

    // Checking if is constructor or function
    const dataArray = (dataType.prototype &&
        Object.getOwnPropertyNames(dataType.prototype).length > 1)
      ? data instanceof dataType ? data : new dataType(data)
      : dataType(data);

    this.type = type;
    this.data = {
      ty: type,
      c: dataArray,
    };
    this.dims = dims;
    this.size = dataArray.length;
  }
}

class InferenceSession {
  sessionId;
  inputNames;
  outputNames;

  constructor(sessionId, inputNames, outputNames) {
    this.sessionId = sessionId;
    this.inputNames = inputNames;
    this.outputNames = outputNames;
  }

  static async fromBuffer(modelBuffer) {
    const [id, inputs, outputs] = await core.ops.op_ai_ort_init_session(
      modelBuffer,
    );

    return new InferenceSession(id, inputs, outputs);
  }

  async run(inputs) {
    const sessionInputs = {};

    for (const key in inputs) {
      if (Object.hasOwn(inputs, key)) {
        const tensorLike = inputs[key];
        // NOTE:(kallebysantos) we first apply the proxy because data could be either TypedArray or {ty: DataType, c: TypedArray}
        const { type, data, dims } = TensorProxy.fromTensor(tensorLike);

        sessionInputs[key] = new Tensor(type, data, dims);
      }
    }

    const outputs = await core.ops.op_ai_ort_run_session(
      this.sessionId,
      sessionInputs,
    );

    for (const key in outputs) {
      if (Object.hasOwn(outputs, key)) {
        const { type, data, dims } = outputs[key];

        const tensor = new Tensor(type, data.buffer, dims);
        outputs[key] = TensorProxy.fromTensor(tensor);
      }
    }

    return outputs;
  }
}

const onnxruntime = {
  Tensor,
  env: {},
  InferenceSession: {
    create: InferenceSession.fromBuffer,
  },
};

globalThis[Symbol.for("onnxruntime")] = onnxruntime;
