// LogicGateNode/constants.ts
import { LogicGateNodeConfig } from './schema';

export const LOGIC_GATE_DEFAULTS: LogicGateNodeConfig = {
  name: 'Compuerta Lógica',
  gateType: 'AND',
};

export const HELP_CONTENT = {
  nodeType: 'logic-gate',
  title: 'Compuerta Lógica',
  description: 'Este nodo permite seleccionar y evaluar una compuerta lógica básica entre dos valores booleanos (a y b).',
  usage: [
    'Selecciona el tipo de compuerta que deseas aplicar.',
    'Conecta dos valores booleanos como entrada.',
    'El nodo devolverá el resultado lógico correspondiente.',
  ],
  examples: [
    'Entrada: a=true, b=false, compuerta=AND => Salida: false',
    'Entrada: a=true, b=false, compuerta=OR => Salida: true',
    'Entrada: a=true, compuerta=NOT => Salida: false',
  ],
  tips: [
    'Usa NOT solo con una entrada (a); la entrada b será ignorada.',
    'El resultado se puede almacenar en una variable para futuras evaluaciones.',
  ],
};
