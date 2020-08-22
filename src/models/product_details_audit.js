

module.exports = (sequelize, DataTypes) => {
    const product_details_audit = sequelize.define(
        "product_details_audit", {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        uuid: {
            type: DataTypes.INTEGER,
            allowNull: false,
                   
        },
        name: {
            type: DataTypes.STRING(255)
        },      
        product_code: {
            type: DataTypes.STRING(255)
        },
        role_uuid: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: 1
        },
        created_by: {
            type: DataTypes.INTEGER
        },
        modified_by: {
            type: DataTypes.INTEGER,
            // allowNull: true
        },
        revision: {
            type: DataTypes.INTEGER
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: 1
        }
    },
        {
            createdAt: 'created_date',
            updatedAt: 'modified_date',
            tableName: "product_details_audit",
            indexes: [{
                fields: ["id"]
            }]
        }
    );
      return product_details_audit;
};



