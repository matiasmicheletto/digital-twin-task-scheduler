import { NODE_TYPES, NODE_TYPE_LABELS } from "../../../../shared/network";

export const taskEditDialogConfig = {
    title: "Edit Task",
    type: "TASK",
    fields: [
        {
            attrName: "id",
            label: "Task ID",
            type: "text",
            disabled: true
        },
        {
            attrName: "label",
            label: "Label",
            type: "text"
        },
        {
            attrName: "processorId",
            label: "Processor",
            type: "select",
            options: []
        },
        {
            attrName: "C",
            label: "Execution Time",
            type: "number"
        },
        {
            attrName: "mist",
            labelTrue: "Mist Task",
            labelFalse: "Edge/Cloud Task",
            type: "switch"
        },
        {
            attrName: "T",
            label: "Period",
            type: "number"
        },
        {
            attrName: "D",
            label: "Deadline",
            type: "number"
        },
        {
            attrName: "a",
            label: "Activation Time",
            type: "number"
        },
        {
            attrName: "M",
            label: "Memory Requirement",
            type: "number"
        }
    ]
};

export const nodeEditDialogConfig = {
    title: "Edit Node",
    type: "NODE",
    fields: [
        {
            attrName: "id",
            label: "Node ID",
            type: "text",
            disabled: true
        },
        {
            attrName: "label",
            label: "Label",
            type: "text"
        },
        {
            attrName: "type",
            label: "Node Type",
            type: "select",
            options: Object
              .keys(NODE_TYPES)
              .filter(key => key !== "UNDEFINED")
              .map(key => ({ value:key, text: NODE_TYPE_LABELS[key] }))
        },
        {
            attrName: "memory",
            label: "Memory",
            type: "text"
        },
        {
            attrName: "u",
            label: "Utilization",
            type: "text"
        }
    ]
};

export const edgeEditDialogConfig = {
    title: "Edit Link",
    type: "EDGE",
    fields: [
        {
            attrName: "id",
            label: "Link ID",
            type: "text",
            disabled: true
        },
        {
            attrName: "label",
            label: "Label",
            type: "text"
        },
        {
            attrName: "delay",
            label: "Delay",
            type: "number"
        }
      ]
};