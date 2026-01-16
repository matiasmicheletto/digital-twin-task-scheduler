import argparse
import numpy as np
import pandas as pd
import os

def Read_Entry():
    """Lee los argumentos de entrada desde la línea de comandos"""
    parser = argparse.ArgumentParser(description="DAT Generation")
    parser.add_argument("--Tasks", type=int, required=True, help="Number of Tasks")
    parser.add_argument("--Sensors", type=int, default=0, help="Number of Sensors")
    parser.add_argument("--Actuators", type=int, default=0, help="Number of Actuators")
    parser.add_argument("--Edge", type=int, default=0, help="Number of Edge Servers")
    parser.add_argument("--Fog", type=int, default=0, help="Number of Fogs Servers")

    args = parser.parse_args()

    validate_args(args)

    return args.Tasks, args.Sensors, args.Actuators, args.Edge, args.Fog


def validate_args(args):
    if args.Tasks < 1:
        raise ValueError("Number_Tasks must be >= 1")
    if args.Sensors < 0 or args.Actuators < 0:
        raise ValueError("Sensors and Actuators must be >= 0")
    if args.Sensors > args.Tasks or args.Actuators > args.Tasks :
        raise ValueError("Sensors and Actuators must be < Tasks")


def calculate_values(Number_Tasks, Number_Sensors, Number_Actuators, Number_Edge, Number_Fog):
    """
    Calcula todos los valores del sistema basándose en la entrada y las reglas de negocio definidas.
    """
    # Calcular valores por defecto si no se especificaron
    Number_Sensors = Number_Sensors or max(1, int(Number_Tasks * 0.15))
    Number_Actuators = Number_Actuators or max(1, int(Number_Tasks * 0.05))
    Number_Mist = Number_Sensors + Number_Actuators

    # Calcular Edge si no se especificó
    if Number_Edge == 0:
        upper_edge = max(2, Number_Mist // 4)
        Number_Edge = np.random.randint(1, upper_edge + 1)

    # Ajustar Fog según Edge si no se especificó explícitamente
    if Number_Fog == 0:
        if 10 < Number_Edge <= 20:
            Number_Fog = 2
        elif Number_Edge > 20:
            Number_Fog = Number_Edge % 10 or 1  # Asegurar que no sea 0


    Number_Cloud = 1
    Number_Processors = Number_Mist + Number_Edge + Number_Fog + Number_Cloud
    
    return {
        'Tasks': Number_Tasks,
        'Sensors': Number_Sensors,
        'Actuators': Number_Actuators,
        'Mist': Number_Mist,
        'Edge': Number_Edge,
        'Fog': Number_Fog,
        'Cloud': Number_Cloud,
        'Processors': Number_Processors
    }

def print_configuration(config):
    """Imprime la configuración del sistema de forma formateada"""
    print("=" * 60)
    print("CONFIGURACIÓN DEL SISTEMA")
    print("=" * 60)
    print(f"Tareas: {config['Tasks']}")
    print(f"Sensores: {config['Sensors']} ({config['Sensors']/config['Tasks']*100:.1f}% de tareas)")
    print(f"Actuadores: {config['Actuators']} ({config['Actuators']/config['Tasks']*100:.1f}% de tareas)")
    print(f"Nodos Mist: {config['Mist']} (sensores + actuadores)")
    print(f"Servidores Edge: {config['Edge']}")
    print(f"Servidores Fog: {config['Fog']}")
    print(f"Servidores Cloud: {config['Cloud']}")
    print(f"TOTAL Procesadores: {config['Processors']}")
    
    # Resumen estadístico
    print("=" * 60)
    print("RESUMEN ESTADÍSTICO:")
    print("=" * 60)
    print(f"- Proporción Mist/Total: {config['Mist']/config['Processors']*100:.1f}%")
    print(f"- Proporción Edge/Total: {config['Edge']/config['Processors']*100:.1f}%")
    print(f"- Proporción Fog/Total: {config['Fog']/config['Processors']*100:.1f}%")
    print(f"- Proporción Cloud/Total: {config['Cloud']/config['Processors']*100:.1f}%")

###################################################
################# Tabla de Tareas #################
###################################################

def Tasks_Tables(Number_Tasks, Number_Mist, Number_Sensors):
    ids = []
    c_values = []
    m_values = []
    l_values = []

    for i in range(Number_Tasks):
        if i < Number_Sensors:
            c_value = np.random.randint(5, 15)
            m_value = np.random.choice([5, 7, 9, 11], p=[0.25, 0.25, 0.25, 0.25])
            l_value = i + 1
        elif i >= Number_Sensors and i < Number_Mist:  # Actuators
            c_value = np.random.randint(10, 50)
            m_value = np.random.choice([3, 4, 6, 8], p=[0.25, 0.25, 0.25, 0.25])
            l_value = i + 1
        else: # Cloud/Edge/Fog Tasks
            c_value = np.random.randint(5, 100)
            m_value = np.random.choice([15, 18, 20, 22], p=[0.25, 0.25, 0.25, 0.25])
            l_value = 0
        
        c_values.append(c_value)
        l_values.append(l_value)
        m_values.append(m_value)
        ids.append(i)

    # Crear el DataFrame con los datos
    Tasks = pd.DataFrame({
        'ID': ids,
        'C': c_values,
        'D': np.sum(c_values),
        'T': np.sum(c_values),
        'r':0,
        'M':m_values,
        'Assigned Proccessor':l_values,
    })

    sum_mem_tasks = sum(Tasks['M'][Number_Mist:]) 
    max_mem_tasks = max(Tasks['M'][Number_Mist:])

    u_tasks = Tasks['C']/Tasks['T']   

    print("=" * 60)
    print("TABLAS DE TAREAS:")
    print("=" * 60)
    print(Tasks)

    return Tasks, sum_mem_tasks, max_mem_tasks, u_tasks

###################################################
############## Tabla de Procesadores ##############
###################################################

def Processors_Table(Number_Mist, Number_Edge, Number_Fog, Number_Processors, sum_mem_tasks, max_mem_tasks, flag_edge):
    proc_ids = []
    proc_MEM = []
    proc_U = []
    proc_COST = []
    print(sum_mem_tasks, max_mem_tasks)

    if flag_edge is False:
        den_edge_fog = Number_Edge + Number_Fog
        den_edge = max(1, Number_Edge)  

        mem_tasks_edge_max = int((0.90 * sum_mem_tasks) / den_edge_fog)
        mem_tasks_edge_min = int((0.85 * sum_mem_tasks) / den_edge_fog)

        mem_tasks_fog_max = int((0.90 * sum_mem_tasks) / den_edge)
        mem_tasks_fog_min = int((0.85 * sum_mem_tasks) / den_edge)
    else:
        mem_tasks_edge_max = max_mem_tasks * np.random.uniform(1,2)
        mem_tasks_edge_min = max_mem_tasks * np.random.uniform(2,4)

        mem_tasks_fog_max = max_mem_tasks * np.random.uniform(1,3)
        mem_tasks_fog_min = max_mem_tasks * np.random.uniform(3,5)


    for i in range(Number_Processors):
        proc_ids.append(i)
        if i < Number_Mist:   # Mist
            proc_MEM.append(np.random.choice([12, 13, 14, 15], p=[0.25, 0.25, 0.25, 0.25]))
            proc_U.append(0.5)
            proc_COST.append(0)
        elif i < Number_Mist + Number_Edge:  # Edge
            proc_MEM.append(round(np.random.uniform(mem_tasks_edge_min, mem_tasks_edge_max + 1),3))
            proc_U.append(1)
            proc_COST.append(np.random.randint(10,20))

        elif i < Number_Mist + Number_Edge + Number_Fog:  # Fog
            proc_MEM.append(round(np.random.uniform(mem_tasks_fog_min, mem_tasks_fog_max + 1),3))
            proc_U.append(1)
            proc_COST.append(np.random.randint(25,30))

        else:  # Cloud Servers
            proc_MEM.append(np.random.uniform(3,7)*sum_mem_tasks)
            proc_U.append(1)
            proc_COST.append(np.random.randint(40,50))

    # Crear el DataFrame con los datos
    Processors = pd.DataFrame({
        'ID': proc_ids,
        'MEM': proc_MEM,
        'U': proc_U,
        'COST':proc_COST,
    })  

    print("=" * 60)
    print("TABLA DE PROCESADORES:")
    print("=" * 60)
    print(Processors)

    return Processors

###################################################
############## Tabla de Precedencias ##############
###################################################

def Precedences_Table(Number_Tasks, Number_Sensors, Number_Actuators, Number_Mist):
    prob_precedence = 0.3
    precedence_matrix = np.zeros((Number_Tasks, Number_Tasks), dtype=int)

    # Rangos
    sensor_end = Number_Sensors
    actuator_start = Number_Sensors
    actuator_end = Number_Mist

    # 1) Generación base válida
    for i in range(Number_Tasks):
        for j in range(Number_Tasks):

            if i == j:
                continue

            if j <= i:
                continue

            # Mist → Mist prohibido
            if i < Number_Mist and j < Number_Mist:
                continue

            # Actuator no precede a nadie
            if actuator_start <= i < actuator_end:
                continue

            # Mist → Actuator prohibido
            if i < Number_Sensors and actuator_start <= j < actuator_end:
                continue

            if np.random.rand() < prob_precedence:
                precedence_matrix[i, j] = 1


    no_mists_tasks = np.arange(Number_Mist, Number_Tasks)

    # 2) Por lo menos 1 tarea anteceda a cada actuador 
    for i in range(Number_Actuators):
        posibles_predecessor = np.random.choice(no_mists_tasks)
        no_mists_tasks = no_mists_tasks[no_mists_tasks != posibles_predecessor]
        posibles_succesor = Number_Sensors + i

        precedence_matrix[posibles_predecessor, posibles_succesor] = 1


    # 3) Expandir a tabla N x N
    Relationship = pd.DataFrame(
        [
            (i, j, precedence_matrix[i, j])
            for i in range(Number_Tasks)
            for j in range(Number_Tasks)
        ],
        columns=["Predecessor", "Successor", "Relationship"]
    )

    print("=" * 60)
    print("TABLA DE PRECEDENCIAS:")
    print("=" * 60)
    print(Relationship)

    return Relationship

###################################################
########## Tabla de Comunicaciones ################
###################################################
def Comunications_Table(Number_Mist, Number_Edge, Number_Fog, Number_Processors ):
    comm_src = []
    comm_dst = []
    comm_delay = []

    # Índices de inicio
    mist_start = 0
    edge_start = Number_Mist
    fog_start  = Number_Mist + Number_Edge
    cloud_id   = Number_Processors - 1

    for i in range(Number_Processors):
        for j in range(Number_Processors):

            comm_src.append(i)
            comm_dst.append(j)

            # 1) Mismo procesador
            if i == j:
                delay = 0

            # 2) Mist ↔ Mist
            elif i < edge_start and j < edge_start:
                delay = 1000

            # 3) Mist ↔ Edge
            elif (i < edge_start and edge_start <= j < fog_start) or \
                (j < edge_start and edge_start <= i < fog_start):
                delay = 2

            # 4) Edge ↔ Fog (si existe Fog)
            elif Number_Fog > 0 and (
                (edge_start <= i < fog_start and fog_start <= j < cloud_id) or
                (edge_start <= j < fog_start and fog_start <= i < cloud_id)
            ):
                delay = 2

            # 5) Edge ↔ Cloud (si NO hay Fog)
            elif Number_Fog == 0 and (
                (edge_start <= i < fog_start and j == cloud_id) or
                (edge_start <= j < fog_start and i == cloud_id)
            ):
                delay = 4

            # 6) Mist ↔ Cloud
            elif (i < edge_start and j == cloud_id) or \
                (j < edge_start and i == cloud_id):
                delay = 5

            # 7) Fog ↔ Cloud
            elif Number_Fog > 0 and (
                (fog_start <= i < cloud_id and j == cloud_id) or
                (fog_start <= j < cloud_id and i == cloud_id)
            ):
                delay = 2

            # 8) Cualquier otro caso
            else:
                delay = 1000

            comm_delay.append(delay)

    # Crear DataFrame
    Communication = pd.DataFrame({
        'Source': comm_src,
        'Destination': comm_dst,
        'Delay': comm_delay
    })
    
    print("=" * 60)
    print("TABLA DE COMUNICACIONES:")
    print("=" * 60)
    print(Communication)

    return Communication

#############################################
############## EXPORTAR A DAT ###############
#############################################

def Generar_Dat(Number_Tasks, Number_Processors, Processors, Tasks, Relationship, Communication ):
    folder = "dat"
    os.makedirs(folder, exist_ok=True)

    output_file = os.path.join(folder, f"instance_{Number_Tasks}x{Number_Processors}.dat")

    with open(output_file, "w") as f:

        # =========================================
        # PROCESADORES
        # =========================================
        f.write(f"{Number_Processors}\n")
        for _, row in Processors.iterrows():
            f.write(
                f"{int(row['ID']+1)}\t"
                f"{int(row['MEM'])}\t"
                f"{round(row['U'],3)}\t"
                f"{int(row['COST'])}\n"
            )

        # =========================================
        # TAREAS
        # =========================================
        f.write(f"{Number_Tasks-1}\n")
        for _, row in Tasks.iterrows():
            f.write(
                f"{row['ID']}\t"
                f"{row['C']}\t"
                f"{row['T']}\t"
                f"{row['D']}\t"
                f"{row['r']}\t"
                f"{row['M']}\t"
                f"{row['Assigned Proccessor']}\n"
            )

        # =========================================
        # PRECEDENCIAS
        # =========================================
        f.write(f"{len(Relationship)}\n")
        for _, row in Relationship.iterrows():
            f.write(
                f"{row['Predecessor']}\t"
                f"{row['Successor']}\t"
                f"{row['Relationship']}\n"
            )

        # =========================================
        # COMUNICACIONES
        # =========================================
        f.write(f"{len(Communication)}\n")
        for _, row in Communication.iterrows():
            f.write(
                f"{row['Source']+1}\t"
                f"{row['Destination']+1}\t"
                f"{row['Delay']}\n"
            )

    print(f"Archivo '{output_file}' generado correctamente ✅")


# =====================================================
# FUNCIÓN PARA GENERAR EL FORMATO 2 (nuevo formato)
# =====================================================
def Generar_Dat_Formato2(Number_Tasks, Number_Processors, Processors, Tasks, Relationship, Communication):
    """Genera archivo .dat en el segundo formato"""
    folder = "dat"
    os.makedirs(folder, exist_ok=True)
    
    output_file = os.path.join(folder, f"instance_{Number_Tasks}x{Number_Processors}_formato2.dat")
    
    with open(output_file, "w") as f:
        # =========================
        # DIMENSIONES
        # =========================
        f.write("# =========================\n")
        f.write("# DIMENSIONES\n")
        f.write("# =========================\n\n")
        
        f.write(f"param S := {Number_Tasks};\n")
        f.write(f"param P := {Number_Processors};\n\n")
        
        f.write(f"param alpha := 1;\n")
        f.write(f"param beta  := 0.1;\n")
        f.write(f"param BigM  := 5000;\n\n")
        
        # =========================
        # SERVIDORES (MEM, CPU, COST)
        # =========================
        f.write("# =========================\n")
        f.write("# SERVIDORES (MEM, CPU, COST)\n")
        f.write("# =========================\n\n")
        
        f.write("param : M   U  COST :=\n")
        for _, row in Processors.iterrows():
            server_id = int(row['ID']) + 1
            mem = int(row['MEM'])
            cpu = round(row['U'], 3)
            cost = int(row['COST'])
            f.write(f"{server_id:<4} {mem:<4} {cpu:<5} {cost}\n")
        f.write(";\n\n")
        
        # =========================
        # TAREAS
        # id  C   T   D   ac  Mem
        # =========================
        f.write("# =========================\n")
        f.write("# TAREAS\n")
        f.write("# id  C   T   D   ac  Mem\n")
        f.write("# =========================\n\n")
        
        f.write("param : \n")
        f.write("C   T   D   ac  MemTask :=\n")
        
        for task_id, row in Tasks.iterrows():
            c = int(row['C'])
            t = int(row['T'])
            d = int(row['D'])
            ac = 0
            mem = int(row['M'])
            f.write(f"{task_id:<4} {c:<4} {t:<4} {d:<4} {ac:<4} {mem}\n")
        f.write(";\n\n")
        
        # =========================
        # SERVIDORES FIJOS
        # =========================
        f.write("# =========================\n")
        f.write("# SERVIDORES FIJOS\n")
        f.write("# =========================\n")
        f.write("# 0 = libre\n\n")
        
        f.write("param ServidorFijo :=\n")
        for task_id, row in Tasks.iterrows():
            assigned_proc = int(row['Assigned Proccessor'])
            if assigned_proc != 0:
                f.write(f"{task_id:<4} {assigned_proc}\n")
        f.write(";\n\n")
        
        # =========================
        # PRECEDENCIAS (DAG)
        # =========================
        f.write("# =========================\n")
        f.write("# PRECEDENCIAS (DAG)\n")
        f.write("# τ_h ≺ τ_i\n")
        f.write("# =========================\n\n")
        
        f.write("set PRECEDENCES :=\n")
        
        precedences = Relationship[Relationship['Relationship'] == 1]
        
        for _, row in precedences.iterrows():
            f.write(f"({int(row['Predecessor'])},{int(row['Successor'])})\n")
        
        f.write(";\n\n")
        
        # =========================
        # DELAYS DE COMUNICACIÓN - FORMATO CORREGIDO
        # =========================
        f.write("# =========================\n")
        f.write("# DELAYS DE COMUNICACIÓN\n")
        f.write("# =========================\n\n")
        
        f.write("param Delta :=\n")
        
        # Crear matriz de delays para acceso rápido
        delay_matrix = {}
        for _, row in Communication.iterrows():
            src = int(row['Source']) + 1
            dst = int(row['Destination']) + 1
            delay = int(row['Delay'])
            delay_matrix[(src, dst)] = delay
        
        # Escribir en formato exacto como el ejemplo
        # Organizar por filas (source) con 6 columnas por bloque
        entries_per_line = 6
        
        for src in range(1, Number_Processors + 1):
            # Escribir la fila actual
            line_count = 0
            first_in_line = True
            
            for dst in range(1, Number_Processors + 1):
                delay = delay_matrix.get((src, dst), 0)
                
                if first_in_line:
                    f.write(f"[{src},{dst}]   {delay:<4}")
                    first_in_line = False
                    line_count = 1
                else:
                    f.write(f"[{src},{dst}]   {delay:<4}")
                    line_count += 1
                
                # Si hemos escrito 6 pares, nueva línea
                if line_count >= entries_per_line and dst < Number_Processors:
                    f.write("\n")
                    first_in_line = True
                    line_count = 0
                elif dst < Number_Processors:
                    f.write(" ")
            
            # Nueva línea después de cada fila completa
            f.write("\n")
            
            # Línea en blanco entre bloques (opcional, para mejor legibilidad)
            if src < Number_Processors:
                f.write("\n")
        
        f.write(";\n")
    
    print(f"Archivo '{output_file}' generado correctamente (Formato 2) ✅")


# Leer entrada
Number_Tasks, Number_Sensors, Number_Actuators, Number_Edge, Number_Fog = Read_Entry()

flag_edge = Number_Edge > 0
   
# Calcular valores
config = calculate_values(Number_Tasks, Number_Sensors, Number_Actuators, Number_Edge, Number_Fog)
    
# Mostrar resultados
print_configuration(config)

Number_Tasks = config['Tasks']
Number_Sensors = config['Sensors']
Number_Actuators = config['Actuators']
Number_Mist = config['Mist']
Number_Edge = config['Edge']
Number_Fog = config['Fog']
Number_Cloud = config['Cloud']
Number_Processors = config['Processors']

Tasks, sum_mem_tasks, max_mem_tasks, u_tasks = Tasks_Tables(Number_Tasks, Number_Mist, Number_Sensors)


Processors = Processors_Table(Number_Mist, Number_Edge, Number_Fog, Number_Processors, sum_mem_tasks, max_mem_tasks, flag_edge)

Relationship =  Precedences_Table(Number_Tasks, Number_Sensors, Number_Actuators, Number_Mist)

Communication = Comunications_Table(Number_Mist, Number_Edge, Number_Fog, Number_Processors )

Generar_Dat(Number_Tasks, Number_Processors, Processors, Tasks, Relationship, Communication)

Generar_Dat_Formato2(Number_Tasks, Number_Processors, Processors, Tasks, Relationship, Communication)



