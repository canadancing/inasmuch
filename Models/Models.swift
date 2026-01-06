import Foundation
import SwiftData

@Model
final class Resident {
    var id: UUID
    var name: String
    var dateAdded: Date
    var isActive: Bool
    
    init(name: String, isActive: Bool = true) {
        self.id = UUID()
        self.name = name
        self.dateAdded = Date()
        self.isActive = isActive
    }
}

@Model
final class SupplyItem {
    var id: UUID
    var name: String
    var iconName: String // SF Symbol name
    var dateAdded: Date
    var isActive: Bool
    
    init(name: String, iconName: String, isActive: Bool = true) {
        self.id = UUID()
        self.name = name
        self.iconName = iconName
        self.dateAdded = Date()
        self.isActive = isActive
    }
}

enum HistoryType: String, Codable {
    case usage = "Usage"
    case restock = "Restock"
    case residentAdded = "Resident Added"
    case residentRemoved = "Resident Removed"
    case itemAdded = "Item Added"
    case itemRemoved = "Item Removed"
}

@Model
final class HistoryEntry {
    var id: UUID
    var date: Date
    var typeRawValue: String
    var residentName: String?
    var itemName: String?
    var quantity: Int?
    var details: String?
    
    var type: HistoryType {
        get { HistoryType(rawValue: typeRawValue) ?? .usage }
        set { typeRawValue = newValue.rawValue }
    }
    
    init(type: HistoryType, residentName: String? = nil, itemName: String? = nil, quantity: Int? = nil, details: String? = nil) {
        self.id = UUID()
        self.date = Date()
        self.typeRawValue = type.rawValue
        self.residentName = residentName
        self.itemName = itemName
        self.quantity = quantity
        self.details = details
    }
}
