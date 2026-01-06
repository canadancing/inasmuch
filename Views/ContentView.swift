import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            ResidentView()
                .tabItem {
                    Label("Log Supply", systemImage: "square.and.pencil")
                }
            
            AdminView()
                .tabItem {
                    Label("Admin", systemImage: "gearshape")
                }
        }
    }
}
