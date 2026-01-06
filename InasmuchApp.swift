import SwiftUI
import SwiftData

@main
struct InasmuchApp: App {
    let container: ModelContainer
    
    init() {
        do {
            let schema = Schema([
                Resident.self,
                SupplyItem.self,
                HistoryEntry.self
            ])
            let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false, cloudKitDatabase: .private)
            
            container = try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(container)
    }
}
