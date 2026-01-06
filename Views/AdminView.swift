import SwiftUI
import SwiftData

struct AdminView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \HistoryEntry.date, order: .reverse) private var history: [HistoryEntry]
    @State private var showingSettings = false
    @State private var showingShareSheet = false
    @State private var exportURL: URL?
    
    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("Statistics")) {
                    StatsView(history: history)
                }
                
                Section(header: Text("History Log")) {
                    if history.isEmpty {
                        Text("No history yet.")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(history) { entry in
                            HistoryRow(entry: entry)
                        }
                    }
                }
            }
            .navigationTitle("Admin")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showingSettings = true }) {
                        Label("Settings", systemImage: "gear")
                    }
                }
                
                ToolbarItem(placement: .cancellationAction) {
                    Button(action: exportCSV) {
                        Label("Export CSV", systemImage: "square.and.arrow.up")
                    }
                }
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView()
            }
            .sheet(isPresented: $showingShareSheet, content: {
                if let url = exportURL {
                    ShareSheet(activityItems: [url])
                }
            })
        }
    }
    
    private func exportCSV() {
        let fileName = "Inasmuch_History.csv"
        let path = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        
        var csvText = "Date,Type,Resident,Item,Quantity,Details\n"
        
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .medium
        
        for entry in history {
            let date = formatter.string(from: entry.date)
            let type = entry.typeRawValue
            let resident = entry.residentName ?? ""
            let item = entry.itemName ?? ""
            let quantity = entry.quantity.map { String($0) } ?? ""
            let details = entry.details ?? ""
            
            let line = "\"\(date)\",\"\(type)\",\"\(resident)\",\"\(item)\",\"\(quantity)\",\"\(details)\"\n"
            csvText.append(line)
        }
        
        do {
            try csvText.write(to: path, atomically: true, encoding: .utf8)
            exportURL = path
            showingShareSheet = true
        } catch {
            print("Failed to create CSV: \(error)")
        }
    }
}

struct StatsView: View {
    let history: [HistoryEntry]
    
    var totalUsageThisMonth: Int {
        let calendar = Calendar.current
        let now = Date()
        let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: now))!
        
        return history.filter {
            $0.type == .usage && $0.date >= startOfMonth
        }.count
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Total Usage (This Month)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("\(totalUsageThisMonth)")
                    .font(.title)
                    .bold()
            }
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

struct HistoryRow: View {
    let entry: HistoryEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(entry.typeRawValue)
                    .font(.caption)
                    .padding(4)
                    .background(colorForType(entry.type).opacity(0.2))
                    .foregroundColor(colorForType(entry.type))
                    .cornerRadius(4)
                
                Spacer()
                
                Text(entry.date.formattedDate())
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            if entry.type == .usage {
                Text("\(entry.residentName ?? "Unknown") took \(entry.quantity ?? 0) \(entry.itemName ?? "Unknown")")
                    .font(.body)
            } else {
                Text(entry.details ?? entry.typeRawValue)
                    .font(.body)
            }
        }
        .padding(.vertical, 4)
    }
    
    private func colorForType(_ type: HistoryType) -> Color {
        switch type {
        case .usage: return .blue
        case .restock: return .green
        case .residentAdded, .residentRemoved: return .orange
        case .itemAdded, .itemRemoved: return .purple
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    var activityItems: [Any]
    var applicationActivities: [UIActivity]? = nil
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: activityItems, applicationActivities: applicationActivities)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
