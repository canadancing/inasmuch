import SwiftUI
import SwiftData

struct ResidentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Resident.name) private var residents: [Resident]
    @Query(sort: \SupplyItem.name) private var items: [SupplyItem]
    
    @State private var selectedResident: Resident?
    @State private var selectedItem: SupplyItem?
    @State private var quantity: Int = 1
    @State private var showingConfirmation: Bool = false
    
    let columns = [
        GridItem(.adaptive(minimum: 100))
    ]
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Resident Picker
                    VStack(alignment: .leading) {
                        Text("Who are you?")
                            .font(.headline)
                        
                        Picker("Select Resident", selection: $selectedResident) {
                            Text("Select Name").tag(nil as Resident?)
                            ForEach(residents) { resident in
                                if resident.isActive {
                                    Text(resident.name).tag(resident as Resident?)
                                }
                            }
                        }
                        .pickerStyle(.menu)
                        .padding()
                        .background(Color.secondary.opacity(0.1))
                        .cornerRadius(10)
                    }
                    .padding(.horizontal)
                    
                    // Item Grid
                    VStack(alignment: .leading) {
                        Text("What are you taking?")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(items) { item in
                                if item.isActive {
                                    ItemButton(item: item, isSelected: selectedItem?.id == item.id) {
                                        selectedItem = item
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // Quantity & Confirm
                    if selectedResident != nil && selectedItem != nil {
                        VStack(spacing: 20) {
                            Stepper("Quantity: \(quantity)", value: $quantity, in: 1...10)
                                .font(.title3)
                                .padding()
                                .background(Color.secondary.opacity(0.1))
                                .cornerRadius(10)
                            
                            Button(action: logUsage) {
                                Text("Confirm")
                                    .font(.title2)
                                    .bold()
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(15)
                            }
                        }
                        .padding()
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Inasmuch")
            .alert("Logged!", isPresented: $showingConfirmation) {
                Button("OK", role: .cancel) { }
            } message: {
                if let resident = selectedResident, let item = selectedItem {
                    Text("\(resident.name) took \(quantity) \(item.name)")
                }
            }
        }
    }
    
    private func logUsage() {
        guard let resident = selectedResident, let item = selectedItem else { return }
        
        let entry = HistoryEntry(
            type: .usage,
            residentName: resident.name,
            itemName: item.name,
            quantity: quantity
        )
        
        modelContext.insert(entry)
        
        // Reset selection (optional, maybe keep resident selected for convenience)
        // selectedResident = nil
        selectedItem = nil
        quantity = 1
        showingConfirmation = true
    }
}

struct ItemButton: View {
    let item: SupplyItem
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack {
                Image(systemName: item.iconName)
                    .font(.system(size: 40))
                    .foregroundColor(isSelected ? .white : .blue)
                    .frame(height: 50)
                
                Text(item.name)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .white : .primary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .aspectRatio(1.0, contentMode: .fit)
            .padding(8)
            .background(isSelected ? Color.blue : Color.secondary.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.blue, lineWidth: isSelected ? 0 : 2)
                    .opacity(isSelected ? 0 : 0.3)
            )
        }
        .buttonStyle(.plain)
    }
}
