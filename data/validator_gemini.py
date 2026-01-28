import csv

def floyd_warshall(n, delays):
    """
    Computes the shortest path delays between all servers.
    delays: dict with keys (s1, s2) and delay values.
    """
    # Initialize distance matrix
    # Using 1000 as infinity as per your file specification
    dist = [[1000 for _ in range(n + 1)] for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        dist[i][i] = 0
        
    for (s1, s2), d in delays.items():
        if s1 <= n and s2 <= n:
            dist[s1][s2] = d

    # Floyd-Warshall algorithm
    for k in range(1, n + 1):
        for i in range(1, n + 1):
            for j in range(1, n + 1):
                if dist[i][j] > dist[i][k] + dist[k][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return dist

def validate_schedule(system_file, schedule_file):
    try:
        with open(system_file, 'r') as f:
            lines = [line.strip().split('\t') for line in f if line.strip()]
    except FileNotFoundError:
        return "Error: System file not found."

    ptr = 0
    
    # 1. Servers
    num_servers = int(lines[ptr][0])
    ptr += 1
    servers = {}
    for _ in range(num_servers):
        s_id, m, u, cost = lines[ptr]
        servers[int(s_id)] = {'mem': float(m)}
        ptr += 1

    # 2. Tasks
    last_task_id = int(lines[ptr][0])
    ptr += 1
    tasks_attr = {}
    for i in range(last_task_id + 1):
        vals = list(map(float, lines[ptr]))
        tasks_attr[int(i)] = {
            'C': vals[0], 'D': vals[2], 'a': vals[3], 
            'M': vals[4], 'pre': int(vals[5])
        }
        ptr += 1

    # 3. Precedences
    num_precedences = int(lines[ptr][0])
    ptr += 1
    precedences = []
    for _ in range(num_precedences):
        t1, t2, rel = map(int, lines[ptr])
        if rel == 1: precedences.append((t1, t2))
        ptr += 1

    # 4. Connections & Shortest Path Computation
    num_conns = int(lines[ptr][0])
    ptr += 1
    raw_delays = {}
    for _ in range(num_conns):
        s1, s2, d = map(int, lines[ptr])
        raw_delays[(s1, s2)] = d
        ptr += 1
    
    # Compute true delays using Floyd-Warshall
    all_pairs_delays = floyd_warshall(num_servers, raw_delays)

    # 5. Load Schedule
    schedule = {}
    errors = []
    try:
        with open(schedule_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                t_id = int(row['task'])
                schedule[t_id] = {
                    'server': int(row['server']),
                    'start': int(row['start']),
                    'finish': int(row['finish'])
                }
    except FileNotFoundError: return "Error: Schedule file not found."

    # --- VALIDATION ---
    
    # Task timing, memory, and pre-allocation
    for t_id, s_data in schedule.items():
        a = tasks_attr[t_id]
        if (s_data['finish'] - s_data['start']) < a['C']:
            errors.append(f"Task {t_id}: Duration < WCET.")
        if s_data['finish'] > a['D']:
            errors.append(f"Task {t_id}: Missed deadline.")
        if s_data['start'] < a['a']:
            errors.append(f"Task {t_id}: Started before activation.")
        if a['pre'] != 0 and s_data['server'] != a['pre']:
            errors.append(f"Task {t_id}: Wrong server (Required {a['pre']}).")
        if a['M'] > servers[s_data['server']]['mem']:
            errors.append(f"Task {t_id}: Memory overflow on Server {s_data['server']}.")

    # Server Overlaps
    server_usage = {}
    for t_id, s_data in schedule.items():
        server_usage.setdefault(s_data['server'], []).append(s_data)
    
    for s_id, tasks in server_usage.items():
        tasks.sort(key=lambda x: x['start'])
        for i in range(len(tasks)-1):
            if tasks[i]['finish'] > tasks[i+1]['start']:
                errors.append(f"Server {s_id}: Overlap detected.")

    # Precedence & Shortest Path Delay
    for p_from, p_to in precedences:
        if p_from in schedule and p_to in schedule:
            s1, s2 = schedule[p_from]['server'], schedule[p_to]['server']
            min_delay = all_pairs_delays[s1][s2]
            
            if min_delay >= 1000:
                errors.append(f"Precedence Error: No path between Server {s1} and {s2} for Tasks {p_from}->{p_to}")
            elif schedule[p_to]['start'] < (schedule[p_from]['finish'] + min_delay):
                errors.append(f"Precedence Error: Task {p_to} starts before Task {p_from} finishes + delay {min_delay}")

    return "FEASIBLE" if not errors else "NOT FEASIBLE:\n" + "\n".join(errors)


if __name__ == "__main__":
    system_file = 'data/system.txt'
    schedule_file = 'data/schedule.csv'
    result = validate_schedule(system_file, schedule_file)
    print(result)