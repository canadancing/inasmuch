import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Resident.name) private var residents: [Resident]
    @Query(sort: \SupplyItem.name) private var items: [SupplyItem]
    
    @State private var newResidentName = ""
    @State private var newItemName = ""
    @State private var newItemIcon = "cube.box"
    @AppStorage("appearanceMode") private var appearanceMode: AppearanceMode = .auto
    
    enum AppearanceMode: String, CaseIterable, Identifiable {
        case auto, light, dark
        var id: Self { self }
    }
    
    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("Appearance")) {
                    Picker("Theme", selection: $appearanceMode) {
                        ForEach(AppearanceMode.allCases) { mode in
                            Text(mode.rawValue.capitalized).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: appearanceMode) { _, newValue in
                        updateAppearance(newValue)
                    }
                }
                
                Section(header: Text("Residents")) {
                    HStack {
                        TextField("New Resident Name", text: $newResidentName)
                        Button("Add") {
                            addResident()
                        }
                        .disabled(newResidentName.isEmpty)
                    }
                    
                    ForEach(residents) { resident in
                        if resident.isActive {
                            HStack {
                                Text(resident.name)
                                Spacer()
                                Button(role: .destructive) {
                                    removeResident(resident)
                                } label: {
                                    Image(systemName: "trash")
                                        .foregroundColor(.red)
                                }
                                .buttonStyle(.borderless)
                            }
                        }
                    }
                }
                
                Section(header: Text("Inventory Items")) {
                    HStack {
                        TextField("New Item Name", text: $newItemName)
                        TextField("Icon (SF Symbol)", text: $newItemIcon)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                            .frame(width: 100)
                        
                        Button("Add") {
                            addItem()
                        }
                        .disabled(newItemName.isEmpty)
                    }
                    
                    ForEach(items) { item in
                        if item.isActive {
                            HStack {
                                Image(systemName: item.iconName)
                                Text(item.name)
                                Spacer()
                                Button("Restock") {
                                    restockItem(item)
                                }
                                .font(.caption)
                                .buttonStyle(.bordered)
                                
                                Button(role: .destructive) {
                                    removeItem(item)
                                } label: {
                                    Image(systemName: "trash")
                                        .foregroundColor(.red)
                                }
                                .buttonStyle(.borderless)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func addResident() {
        let resident = Resident(name: newResidentName)
        modelContext.insert(resident)
        
        let history = HistoryEntry(type: .residentAdded, details: "Added resident: \(newResidentName)")
        modelContext.insert(history)
        
        newResidentName = ""
    }
    
    private func removeResident(_ resident: Resident) {
        resident.isActive = false // Soft delete
        
        let history = HistoryEntry(type: .residentRemoved, details: "Removed resident: \(resident.name)")
        modelContext.insert(history)
    }
    
    private func addItem() {
        let item = SupplyItem(name: newItemName, iconName: newItemIcon)
        modelContext.insert(item)
        
        let history = HistoryEntry(type: .itemAdded, details: "Added item: \(newItemName)")
        modelContext.insert(history)
        
        newItemName = ""
        newItemIcon = "cube.box"
    }
    
    private func removeItem(_ item: SupplyItem) {
        item.isActive = false // Soft delete
        
        let history = HistoryEntry(type: .itemRemoved, details: "Removed item: \(item.name)")
        modelContext.insert(history)
    }
    
    private func restockItem(_ item: SupplyItem) {
        let history = HistoryEntry(type: .restock, itemName: item.name, details: "Restocked \(item.name)")
        modelContext.insert(history)
    }
    
    private func updateAppearance(_ mode: AppearanceMode) {
        #if os(iOS)
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }
        
        windowScene.windows.forEach { window in
            switch mode {
            case .auto:
                window.overrideUserInterfaceStyle = .unspecified
            case .light:
                window.overrideUserInterfaceStyle = .light
            case .dark:
                window.overrideUserInterfaceStyle = .dark
            }
        }
        #elseif os(macOS)
        switch mode {
        case .auto:
            NSApp.appearance = nil
        case .light:
            NSApp.appearance = NSAppearance(named: .aqua)
        case .dark:
            NSApp.appearance = NSAppearance(named: .darkAqua)
        }
        #endif
    }
}
